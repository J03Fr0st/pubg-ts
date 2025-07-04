import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgCacheError,
  PubgConfigurationError,
  PubgNetworkError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../errors';
import type { PubgClientConfig } from '../types/api';
import { createCacheKey, globalCache, type MemoryCache } from '../utils/cache';
import { logger, withTiming } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';

export class HttpClient {
  private axios: AxiosInstance;
  private rateLimiter: RateLimiter;
  private config: PubgClientConfig;
  private cache: MemoryCache;

  constructor(config: PubgClientConfig) {
    this.validateConfig(config);
    this.config = config;
    this.rateLimiter = new RateLimiter(10, 60000);
    this.cache = globalCache;

    this.axios = axios.create({
      baseURL: config.baseUrl || 'https://api.pubg.com',
      timeout: config.timeout || 10000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    logger.client('HTTP client initialized', { shard: config.shard, timeout: config.timeout });
  }

  private validateConfig(config: PubgClientConfig): void {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new PubgConfigurationError(
        'API key is required and must be a valid string',
        'apiKey',
        'string',
        config.apiKey
      );
    }

    if (!config.shard || typeof config.shard !== 'string') {
      throw new PubgConfigurationError(
        'Shard is required and must be a valid string',
        'shard',
        'string',
        config.shard
      );
    }

    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      throw new PubgConfigurationError(
        'Timeout must be a positive number',
        'timeout',
        'positive number',
        config.timeout
      );
    }

    if (
      config.retryAttempts &&
      (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)
    ) {
      throw new PubgConfigurationError(
        'Retry attempts must be a non-negative number',
        'retryAttempts',
        'non-negative number',
        config.retryAttempts
      );
    }

    if (config.retryDelay && (typeof config.retryDelay !== 'number' || config.retryDelay < 0)) {
      throw new PubgConfigurationError(
        'Retry delay must be a non-negative number',
        'retryDelay',
        'non-negative number',
        config.retryDelay
      );
    }
  }

  private setupInterceptors(): void {
    this.axios.interceptors.request.use(
      async (config) => {
        await this.rateLimiter.waitForSlot();
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.errors?.[0]?.detail || error.message;
        const url = error.config?.url || 'unknown';

        // Handle network-level errors (no response received)
        if (!error.response) {
          return this.handleNetworkError(error, url);
        }

        switch (status) {
          case 401:
            throw new PubgAuthenticationError(message, {
              operation: 'http_request',
              metadata: { url, method: error.config?.method },
            });
          case 404:
            throw new PubgNotFoundError(message, {
              operation: 'http_request',
              metadata: { url, method: error.config?.method },
            });
          case 400:
            throw new PubgValidationError(message, {
              operation: 'http_request',
              metadata: { url, method: error.config?.method },
            });
          case 429: {
            const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60');
            throw new PubgRateLimitError(message, retryAfter, {
              operation: 'http_request',
              metadata: { url, method: error.config?.method, retryAfter },
            });
          }
          case 500:
          case 502:
          case 503:
          case 504:
            if (this.config.retryAttempts && this.config.retryAttempts > 0) {
              return this.retryRequest(error);
            }
            throw new PubgNetworkError(`Server error: ${message}`, 'request', error, {
              operation: 'http_request',
              metadata: { url, method: error.config?.method, statusCode: status },
            });
          default:
            throw new PubgApiError(message, status, error.response?.data, {
              operation: 'http_request',
              metadata: { url, method: error.config?.method },
            });
        }
      }
    );
  }

  private handleNetworkError(error: any, url: string): never {
    const code = error.code;
    const message = error.message;

    switch (code) {
      case 'ECONNREFUSED':
        throw new PubgNetworkError(`Connection refused: ${message}`, 'connect', error, {
          operation: 'network_connect',
          metadata: { url, errorCode: code },
        });
      case 'ENOTFOUND':
      case 'EAI_AGAIN':
        throw new PubgNetworkError(`DNS lookup failed: ${message}`, 'dns', error, {
          operation: 'network_dns',
          metadata: { url, errorCode: code },
        });
      case 'ECONNRESET':
      case 'ECONNABORTED':
        throw new PubgNetworkError(`Connection reset: ${message}`, 'connect', error, {
          operation: 'network_connect',
          metadata: { url, errorCode: code },
        });
      case 'ETIMEDOUT':
        throw new PubgNetworkError(`Request timeout: ${message}`, 'timeout', error, {
          operation: 'network_timeout',
          metadata: { url, errorCode: code, timeout: this.config.timeout },
        });
      case 'CERT_HAS_EXPIRED':
      case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
        throw new PubgNetworkError(`SSL certificate error: ${message}`, 'ssl', error, {
          operation: 'network_ssl',
          metadata: { url, errorCode: code },
        });
      default:
        throw new PubgNetworkError(`Network error: ${message}`, 'unknown', error, {
          operation: 'network_unknown',
          metadata: { url, errorCode: code },
        });
    }
  }

  private async retryRequest(error: any, attempt: number = 1): Promise<AxiosResponse> {
    if (attempt > (this.config.retryAttempts || 3)) {
      // Convert to network error if it's a network issue
      if (!error.response) {
        const url = error.config?.url || 'unknown';
        throw new PubgNetworkError(
          `Max retry attempts reached: ${error.message}`,
          'request',
          error,
          {
            operation: 'network_retry_exhausted',
            metadata: { url, maxAttempts: this.config.retryAttempts || 3, attempt },
          }
        );
      }
      throw error;
    }

    const delay = (this.config.retryDelay || 1000) * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await this.axios.request(error.config);
    } catch (retryError) {
      return this.retryRequest(retryError, attempt + 1);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig & { useCache?: boolean }): Promise<T> {
    const useCache = config?.useCache !== false; // Default to true
    const cacheKey = createCacheKey('http', 'GET', url, JSON.stringify(config?.params || {}));

    // Check cache first for GET requests
    if (useCache) {
      try {
        const cached = this.cache.get<T>(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
      } catch (error) {
        throw new PubgCacheError(
          `Failed to retrieve from cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cacheKey,
          'get',
          {
            operation: 'cache_get',
            metadata: { url, method: 'GET' },
          }
        );
      }
    }

    return withTiming(logger.http, `GET ${url}`, async () => {
      const response = await this.axios.get<T>(url, config);

      // Cache successful GET responses
      if (useCache && response.status === 200) {
        try {
          this.cache.set(cacheKey, response.data, 5 * 60 * 1000); // 5 minute cache
        } catch (error) {
          // Log cache set error but don't fail the request
          logger.http(
            `Cache set failed for ${cacheKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return response.data;
    });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  getRateLimitStatus() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getResetTime(),
    };
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    try {
      this.cache.clear();
    } catch (error) {
      throw new PubgCacheError(
        `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'all',
        'cleanup',
        {
          operation: 'cache_clear',
        }
      );
    }
  }
}
