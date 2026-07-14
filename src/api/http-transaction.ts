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
  externalGet?: ExternalGetFunction;
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

/**
 * Internal request transaction runner for a client-local runtime.
 *
 * @internal
 */
export class HttpTransactionRunner {
  private request: RequestFunction;
  private externalGet?: ExternalGetFunction;
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
    if (!this.externalGet) {
      throw new PubgNetworkError('External GET request function is not configured', 'request');
    }

    const requestConfig = {
      ...config,
      method: 'get',
      timeout: this.config.timeout ?? 10000,
      url,
    };

    try {
      const response = await this.externalGet<T>(url, requestConfig);
      return response.data;
    } catch (error) {
      throw this.mapExternalError(error);
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
      if (this.shouldRetry(error, attempt)) {
        await this.waitForRetry(attempt);
        return await this.execute<T>(this.getRetryConfig(error, requestConfig), attempt + 1);
      }

      this.recordOutcome(this.outcomeForError(error));
      throw this.mapError(error, requestConfig);
    }
  }

  private outcomeForError(error: any): RequestOutcome {
    const status = error.response?.status;

    if (status === 401) return { kind: 'authentication_failed', statusCode: 401 };
    if (status === 429) return { kind: 'rate_limited', statusCode: 429 };
    if (status === 400 || status === 404) return { kind: 'request_rejected', statusCode: status };
    if (typeof status === 'number' && status >= 500) {
      return { kind: 'server_failed', statusCode: status };
    }
    return { kind: 'network_failed' };
  }

  private shouldRetry(error: any, attempt: number): boolean {
    const retryAttempts = this.config.retryAttempts ?? 0;
    const status = error.response?.status;

    return attempt <= retryAttempts && SERVER_RETRY_STATUSES.has(status);
  }

  private async waitForRetry(attempt: number): Promise<void> {
    const delay = (this.config.retryDelay ?? 1000) * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private getRetryConfig(error: any, fallbackConfig: AxiosRequestConfig): AxiosRequestConfig {
    return error.config || fallbackConfig;
  }

  private mapError(error: any, fallbackConfig: AxiosRequestConfig): PubgApiError {
    const status = error.response?.status;
    const message = error.response?.data?.errors?.[0]?.detail || error.message;
    const errorConfig = error.config || fallbackConfig;
    const url = errorConfig?.url || 'unknown';

    if (!error.response) {
      return this.mapNetworkError(error, url);
    }

    switch (status) {
      case 401:
        return new PubgAuthenticationError(message, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
      case 404:
        return new PubgNotFoundError(message, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
      case 400:
        return new PubgValidationError(message, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
      case 429: {
        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60', 10);
        return new PubgRateLimitError(message, retryAfter, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method, retryAfter },
        });
      }
      case 500:
      case 502:
      case 503:
      case 504:
        return new PubgNetworkError(`Server error: ${message}`, 'request', error, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method, statusCode: status },
        });
      default:
        return new PubgApiError(message, status, error.response?.data, {
          operation: 'http_request',
          metadata: { url, method: errorConfig?.method },
        });
    }
  }

  private mapExternalError(error: any): PubgApiError {
    const status = error.response?.status;
    const metadata = { endpoint: EXTERNAL_TELEMETRY_ENDPOINT, method: 'get' };
    const context = { operation: EXTERNAL_TELEMETRY_ENDPOINT, metadata };

    if (!error.response) {
      return new PubgNetworkError(
        EXTERNAL_TELEMETRY_ERROR_MESSAGE,
        this.externalNetworkOperationFor(error.code),
        undefined,
        {
          ...context,
          metadata: { ...metadata, errorCode: error.code },
        }
      );
    }

    switch (status) {
      case 401:
        return new PubgAuthenticationError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, context);
      case 404:
        return new PubgNotFoundError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, context);
      case 400:
        return new PubgValidationError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, context);
      case 429: {
        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60', 10);
        return new PubgRateLimitError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, retryAfter, {
          ...context,
          metadata: { ...metadata, retryAfter },
        });
      }
      case 500:
      case 502:
      case 503:
      case 504:
        return new PubgNetworkError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, 'request', undefined, {
          ...context,
          metadata: { ...metadata, statusCode: status },
        });
      default:
        return new PubgApiError(EXTERNAL_TELEMETRY_ERROR_MESSAGE, status, undefined, context);
    }
  }

  private externalNetworkOperationFor(
    code: string | undefined
  ): PubgNetworkError['networkOperation'] {
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

  private mapNetworkError(error: any, url: string): PubgNetworkError {
    const code = error.code;
    const message = error.message;

    switch (code) {
      case 'ECONNREFUSED':
        return new PubgNetworkError(`Connection refused: ${message}`, 'connect', error, {
          operation: 'network_connect',
          metadata: { url, errorCode: code },
        });
      case 'ENOTFOUND':
      case 'EAI_AGAIN':
        return new PubgNetworkError(`DNS lookup failed: ${message}`, 'dns', error, {
          operation: 'network_dns',
          metadata: { url, errorCode: code },
        });
      case 'ECONNRESET':
      case 'ECONNABORTED':
        return new PubgNetworkError(`Connection reset: ${message}`, 'connect', error, {
          operation: 'network_connect',
          metadata: { url, errorCode: code },
        });
      case 'ETIMEDOUT':
        return new PubgNetworkError(`Request timeout: ${message}`, 'timeout', error, {
          operation: 'network_timeout',
          metadata: { url, errorCode: code, timeout: this.config.timeout },
        });
      case 'CERT_HAS_EXPIRED':
      case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
        return new PubgNetworkError(`SSL certificate error: ${message}`, 'ssl', error, {
          operation: 'network_ssl',
          metadata: { url, errorCode: code },
        });
      default:
        return new PubgNetworkError(`Network error: ${message}`, 'unknown', error, {
          operation: 'network_unknown',
          metadata: { url, errorCode: code },
        });
    }
  }
}
