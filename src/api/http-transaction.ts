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
import type { ObservabilitySpan, RuntimeObservability } from '../utils/observability';
import type { RateLimiter } from '../utils/rate-limiter';
import type { RequestDeduplicator } from '../utils/request';

type CacheRequestConfig = AxiosRequestConfig & { useCache?: boolean };

type RequestFunction = (config: AxiosRequestConfig) => Promise<AxiosResponse>;

type ExternalGetFunction = <T>(
  url: string,
  config?: AxiosRequestConfig
) => Promise<AxiosResponse<T>>;

type RequestMetadata = {
  startTime: number;
  span: ObservabilitySpan;
};

export interface HttpTransactionRunnerDependencies {
  request: RequestFunction;
  externalGet?: ExternalGetFunction;
  cache: MemoryCache;
  rateLimiter: RateLimiter;
  deduplicator: RequestDeduplicator;
  observability: RuntimeObservability;
  config: PubgClientConfig;
}

const getPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    return window.performance;
  }

  return {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
  };
};

const performance = getPerformance();
const SERVER_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const GET_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Internal request transaction runner for HttpClient.
 *
 * @internal
 */
export class HttpTransactionRunner {
  private request: RequestFunction;
  private externalGet?: ExternalGetFunction;
  private cache: MemoryCache;
  private rateLimiter: RateLimiter;
  private deduplicator: RequestDeduplicator;
  private observability: RuntimeObservability;
  private config: PubgClientConfig;

  constructor(dependencies: HttpTransactionRunnerDependencies) {
    this.request = dependencies.request;
    this.externalGet = dependencies.externalGet;
    this.cache = dependencies.cache;
    this.rateLimiter = dependencies.rateLimiter;
    this.deduplicator = dependencies.deduplicator;
    this.observability = dependencies.observability;
    this.config = dependencies.config;
  }

  async get<T>(url: string, config?: CacheRequestConfig): Promise<T> {
    const useCache = config?.useCache !== false;
    const cacheKey = createCacheKey('http', 'GET', url, JSON.stringify(config?.params || {}));

    if (useCache) {
      try {
        const cached = this.cache.get<T>(cacheKey);
        if (cached !== undefined) {
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

    const response = await this.externalGet<T>(url, {
      ...config,
      timeout: this.config.timeout || 10000,
    });

    return response.data;
  }

  private async execute<T>(
    requestConfig: AxiosRequestConfig,
    attempt = 1
  ): Promise<AxiosResponse<T>> {
    const metadata = await this.startRequest(requestConfig);

    try {
      const response = (await this.request(requestConfig)) as AxiosResponse<T>;
      this.recordSuccess(response, metadata);
      return response;
    } catch (error) {
      this.recordFailure(error, requestConfig, metadata);

      if (this.shouldRetry(error, attempt)) {
        await this.waitForRetry(attempt);
        return await this.execute<T>(this.getRetryConfig(error, requestConfig), attempt + 1);
      }

      throw this.mapError(error, requestConfig);
    }
  }

  private async startRequest(config: AxiosRequestConfig): Promise<RequestMetadata> {
    await this.rateLimiter.waitForSlot();

    const method = config.method?.toUpperCase();
    const url = config.url;

    return {
      startTime: performance.now(),
      span: this.observability.startSpan('http_request', {
        endpoint: url,
        method,
        url,
      }),
    };
  }

  private recordSuccess(response: AxiosResponse, metadata: RequestMetadata): void {
    this.recordRequestMetrics(metadata, {
      statusCode: response.status,
      endpoint: response.config.url || 'unknown',
      method: response.config.method?.toUpperCase() || 'unknown',
      error: false,
    });

    metadata.span.setStatus({ code: 1 });
    metadata.span.end();

    const remaining = response.headers['x-ratelimit-remaining'];
    if (remaining) {
      this.observability.updateRateLimitMetrics(parseInt(remaining, 10));
    }
  }

  private recordFailure(
    error: any,
    fallbackConfig: AxiosRequestConfig,
    metadata: RequestMetadata
  ): void {
    const errorConfig = error.config || fallbackConfig;
    const status = error.response?.status;
    const url = errorConfig?.url || 'unknown';

    this.recordRequestMetrics(metadata, {
      statusCode: status || 0,
      endpoint: url,
      method: errorConfig?.method?.toUpperCase() || 'unknown',
      error: true,
    });

    metadata.span.recordException(error);
    metadata.span.setStatus({ code: 2, message: error.message });
    metadata.span.end();

    this.observability.recordError(error, {
      endpoint: url,
      method: errorConfig?.method,
      statusCode: status,
    });
  }

  private recordRequestMetrics(
    metadata: RequestMetadata,
    details: {
      statusCode: number;
      endpoint: string;
      method: string;
      error: boolean;
    }
  ): void {
    this.observability.recordRequestMetrics({
      duration: performance.now() - metadata.startTime,
      ...details,
    });
  }

  private shouldRetry(error: any, attempt: number): boolean {
    const retryAttempts = this.config.retryAttempts || 0;
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
