import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgCacheError,
  PubgNetworkError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../errors';
import type { PubgClientConfig } from '../types/api';
import { createCacheKey, type MemoryCache } from '../utils/cache';
import { logger, withTiming } from '../utils/logger';
import type { RateLimiter } from '../utils/rate-limiter';
import type { RequestDeduplicator } from '../utils/request';
import type { RequestOutcome } from './client-health';
import type { CacheRequestConfig } from './endpoint-transport';

type RequestFunction = (config: AxiosRequestConfig) => Promise<AxiosResponse>;

type ExternalGetFunction = <T>(
  url: string,
  config?: AxiosRequestConfig
) => Promise<AxiosResponse<T>>;

/** Dependencies required by the internal HTTP transaction runner. */
export interface HttpTransactionRunnerDependencies {
  request: RequestFunction;
  externalGet: ExternalGetFunction;
  cache: MemoryCache;
  rateLimiter: RateLimiter;
  deduplicator: RequestDeduplicator;
  recordOutcome: (outcome: RequestOutcome) => void;
  config: Pick<PubgClientConfig, 'timeout' | 'retryAttempts' | 'retryDelay'>;
}

const SERVER_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const GET_CACHE_TTL_MS = 5 * 60 * 1000;
const EXTERNAL_TELEMETRY_ENDPOINT = 'external_telemetry';
const EXTERNAL_TELEMETRY_ERROR_MESSAGE = 'External telemetry request failed';

type RequestFailure =
  | {
      kind: 'authentication' | 'not_found' | 'validation';
      outcome: RequestOutcome;
      statusCode: number;
    }
  | {
      kind: 'rate_limited';
      outcome: RequestOutcome;
      retryAfter: number;
      statusCode: 429;
    }
  | { kind: 'server'; outcome: RequestOutcome; statusCode: number }
  | { kind: 'api'; outcome: RequestOutcome; statusCode?: number }
  | {
      kind: 'network';
      errorCode?: string;
      networkOperation: PubgNetworkError['networkOperation'];
      outcome: RequestOutcome;
    };

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

/**
 * Internal request transaction runner for a client-local runtime.
 *
 * @internal
 */
export class HttpTransactionRunner {
  private request: RequestFunction;
  private externalGet: ExternalGetFunction;
  private cache: MemoryCache;
  private rateLimiter: RateLimiter;
  private deduplicator: RequestDeduplicator;
  private recordOutcome: (outcome: RequestOutcome) => void;
  private config: Pick<PubgClientConfig, 'timeout' | 'retryAttempts' | 'retryDelay'>;

  constructor(dependencies: HttpTransactionRunnerDependencies) {
    this.request = dependencies.request;
    this.externalGet = dependencies.externalGet;
    this.cache = dependencies.cache;
    this.rateLimiter = dependencies.rateLimiter;
    this.deduplicator = dependencies.deduplicator;
    this.recordOutcome = dependencies.recordOutcome;
    this.config = dependencies.config;
  }

  async get<T>(url: string, config?: CacheRequestConfig): Promise<T> {
    const useCache = config?.useCache !== false;
    const cacheKey = createCacheKey('http', 'GET', url, JSON.stringify(config?.params || {}));

    if (useCache) {
      try {
        const cached = this.cache.get<T>(cacheKey);
        if (cached !== undefined) {
          this.recordOutcome({ kind: 'cache_hit' });
          return cached;
        }
      } catch (error) {
        throw new PubgCacheError(
          `Failed to retrieve from cache: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          cacheKey,
          'get',
          {
            operation: 'cache_get',
            metadata: { url, method: 'GET' },
          }
        );
      }
    }

    return this.deduplicator.deduplicate(cacheKey, async () => {
      const response = await withTiming(logger.http, `GET ${url}`, async () => {
        return await this.execute<T>({
          ...config,
          method: 'get',
          url,
        });
      });

      if (useCache && response.status === 200) {
        try {
          this.cache.set(cacheKey, response.data, GET_CACHE_TTL_MS);
        } catch (error) {
          logger.http(
            `Cache set failed for ${cacheKey}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      return response.data;
    });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.execute<T>({
      ...config,
      data,
      method: 'post',
      url,
    });

    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.execute<T>({
      ...config,
      data,
      method: 'put',
      url,
    });

    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.execute<T>({
      ...config,
      method: 'delete',
      url,
    });

    return response.data;
  }

  async getExternal<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const requestConfig = {
      ...config,
      method: 'get',
      timeout: this.config.timeout ?? 10000,
      url,
    };

    try {
      const response = await this.externalGet<T>(url, requestConfig);
      this.recordOutcome({ kind: 'telemetry_succeeded' });
      return response.data;
    } catch (error) {
      const failure = this.interpretFailure(error);
      this.recordOutcome(failure.outcome);
      throw this.mapExternalError(error, failure);
    }
  }

  private async execute<T>(
    requestConfig: AxiosRequestConfig,
    attempt = 1
  ): Promise<AxiosResponse<T>> {
    await this.rateLimiter.waitForSlot();

    try {
      const response = (await this.request(requestConfig)) as AxiosResponse<T>;
      this.recordOutcome({ kind: 'request_succeeded' });
      return response;
    } catch (error) {
      const failure = this.interpretFailure(error);

      if (this.shouldRetry(failure, attempt)) {
        await this.waitForRetry(attempt);
        return await this.execute<T>(this.getRetryConfig(error, requestConfig), attempt + 1);
      }

      this.recordOutcome(failure.outcome);
      throw this.mapError(error, requestConfig, failure);
    }
  }

  private interpretFailure(error: unknown): RequestFailure {
    const errorRecord = asRecord(error);
    const response = asRecord(errorRecord.response);
    const status = typeof response.status === 'number' ? response.status : undefined;

    if (status === 401) {
      return {
        kind: 'authentication',
        outcome: { kind: 'authentication_failed', statusCode: 401 },
        statusCode: 401,
      };
    }
    if (status === 400 || status === 404) {
      return {
        kind: status === 400 ? 'validation' : 'not_found',
        outcome: { kind: 'request_rejected', statusCode: status },
        statusCode: status,
      };
    }
    if (status === 429) {
      const headers = asRecord(response.headers);
      const parsedRetryAfter = Number.parseInt(String(headers['retry-after'] ?? '60'), 10);
      return {
        kind: 'rate_limited',
        outcome: { kind: 'rate_limited', statusCode: 429 },
        retryAfter:
          Number.isFinite(parsedRetryAfter) && parsedRetryAfter >= 0 ? parsedRetryAfter : 60,
        statusCode: 429,
      };
    }
    if (typeof status === 'number' && status >= 500) {
      return {
        kind: SERVER_RETRY_STATUSES.has(status) ? 'server' : 'api',
        outcome: { kind: 'server_failed', statusCode: status },
        statusCode: status,
      };
    }

    if (Object.keys(response).length === 0) {
      const errorCode = typeof errorRecord.code === 'string' ? errorRecord.code : undefined;
      return {
        errorCode,
        kind: 'network',
        networkOperation: this.networkOperationFor(errorCode),
        outcome: { kind: 'network_failed' },
      };
    }

    return {
      kind: 'api',
      outcome:
        typeof status === 'number' && status >= 400 && status < 500
          ? { kind: 'request_rejected', statusCode: status }
          : { kind: 'network_failed' },
      statusCode: status,
    };
  }

  private shouldRetry(failure: RequestFailure, attempt: number): boolean {
    const retryAttempts = this.config.retryAttempts ?? 0;

    return attempt <= retryAttempts && failure.kind === 'server';
  }

  private async waitForRetry(attempt: number): Promise<void> {
    const delay = (this.config.retryDelay ?? 1000) * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private getRetryConfig(error: unknown, fallbackConfig: AxiosRequestConfig): AxiosRequestConfig {
    const errorConfig = asRecord(error).config;
    return typeof errorConfig === 'object' && errorConfig !== null
      ? (errorConfig as AxiosRequestConfig)
      : fallbackConfig;
  }

  private mapError(
    error: unknown,
    fallbackConfig: AxiosRequestConfig,
    failure: RequestFailure
  ): PubgApiError {
    const errorRecord = asRecord(error);
    const response = asRecord(errorRecord.response);
    const responseData = asRecord(response.data);
    const responseErrors = Array.isArray(responseData.errors) ? responseData.errors : [];
    const firstResponseError = asRecord(responseErrors[0]);
    const message =
      typeof firstResponseError.detail === 'string'
        ? firstResponseError.detail
        : error instanceof Error
          ? error.message
          : 'Request failed';
    const errorConfig = this.getRetryConfig(error, fallbackConfig);
    const url = errorConfig.url || 'unknown';

    switch (failure.kind) {
      case 'authentication':
        return new PubgAuthenticationError(message, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
      case 'not_found':
        return new PubgNotFoundError(message, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
      case 'validation':
        return new PubgValidationError(message, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
      case 'rate_limited':
        return new PubgRateLimitError(message, failure.retryAfter, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method, retryAfter: failure.retryAfter },
        });
      case 'server':
        return new PubgNetworkError(`Server error: ${message}`, 'request', undefined, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method, statusCode: failure.statusCode },
        });
      case 'network':
        return this.mapNetworkError(url, failure);
      default:
        return new PubgApiError(message, failure.statusCode, response.data, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
    }
  }

  private mapExternalError(_error: unknown, failure: RequestFailure): PubgApiError {
    const metadata = { endpoint: EXTERNAL_TELEMETRY_ENDPOINT, method: 'get' };
    const context = { operation: EXTERNAL_TELEMETRY_ENDPOINT, metadata };

    switch (failure.kind) {
      case 'authentication':
        return new PubgAuthenticationError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, context);
      case 'not_found':
        return new PubgNotFoundError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, context);
      case 'validation':
        return new PubgValidationError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, context);
      case 'rate_limited':
        return new PubgRateLimitError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, failure.retryAfter, {
          ...context,
          metadata: { ...metadata, retryAfter: failure.retryAfter },
        });
      case 'server':
        return new PubgNetworkError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, 'request', undefined, {
          ...context,
          metadata: { ...metadata, statusCode: failure.statusCode },
        });
      case 'network':
        return new PubgNetworkError(
          EXTERNAL_TELEMETRY_ERROR_MESSAGE,
          failure.networkOperation,
          undefined,
          {
            ...context,
            metadata: { ...metadata, errorCode: failure.errorCode },
          }
        );
      default:
        return new PubgApiError(
          EXTERNAL_TELEMETRY_ERROR_MESSAGE,
          failure.statusCode,
          undefined,
          context
        );
    }
  }

  private networkOperationFor(code: string | undefined): PubgNetworkError['networkOperation'] {
    switch (code) {
      case 'ECONNREFUSED':
      case 'ECONNRESET':
      case 'ECONNABORTED':
        return 'connect';
      case 'ENOTFOUND':
      case 'EAI_AGAIN':
        return 'dns';
      case 'ETIMEDOUT':
        return 'timeout';
      case 'CERT_HAS_EXPIRED':
      case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
        return 'ssl';
      default:
        return 'unknown';
    }
  }

  private mapNetworkError(
    url: string,
    failure: Extract<RequestFailure, { kind: 'network' }>
  ): PubgNetworkError {
    const messages: Record<PubgNetworkError['networkOperation'], string> = {
      connect: 'Connection failed',
      dns: 'DNS lookup failed',
      request: 'Request failed',
      ssl: 'SSL certificate error',
      timeout: 'Request timeout',
      unknown: 'Network error',
    };
    const metadata: Record<string, unknown> = { url, errorCode: failure.errorCode };
    if (failure.networkOperation === 'timeout') metadata.timeout = this.config.timeout;

    return new PubgNetworkError(
      messages[failure.networkOperation],
      failure.networkOperation,
      undefined,
      {
        operation: `network_${failure.networkOperation}`,
        metadata,
      }
    );
  }
}
