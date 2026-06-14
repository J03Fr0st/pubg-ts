import axios, { type AxiosRequestConfig } from 'axios';
import { PubgCacheError, PubgConfigurationError } from '../errors';
import type { PubgClientConfig } from '../types/api';
import { globalCache, type MemoryCache } from '../utils/cache';
import { logger } from '../utils/logger';
import { monitoringSystem } from '../utils/monitoring';
import type { RuntimeObservability } from '../utils/observability';
import { RateLimiter } from '../utils/rate-limiter';
import { RequestDeduplicator } from '../utils/request';
import { HttpTransactionRunner } from './http-transaction';

/**
 * A robust HTTP client for interacting with the PUBG API.
 *
 * @remarks
 * This client handles rate limiting, caching, request retries, and error handling.
 * It is the core component for all API interactions.
 *
 * @internal
 */
export class HttpClient {
  private rateLimiter: RateLimiter;
  private cache: MemoryCache;
  private transactionRunner: HttpTransactionRunner;

  constructor(config: PubgClientConfig, observability: RuntimeObservability = monitoringSystem) {
    this.validateConfig(config);
    this.rateLimiter = new RateLimiter(10, 60000);
    this.cache = globalCache;

    const axiosInstance = axios.create({
      baseURL: config.baseUrl || 'https://api.pubg.com',
      timeout: config.timeout || 10000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });

    this.transactionRunner = new HttpTransactionRunner({
      cache: this.cache,
      config,
      deduplicator: new RequestDeduplicator(),
      externalGet: (url, requestConfig) => axios.get(url, requestConfig),
      observability,
      rateLimiter: this.rateLimiter,
      request: (requestConfig) => axiosInstance.request(requestConfig),
    });

    logger.client('HTTP client initialized', { shard: config.shard, timeout: config.timeout });
  }

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Called from the constructor; keep validation private.
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

  /**
   * Performs a GET request.
   *
   * @param url - The URL to request.
   * @param config - Optional request configuration, including cache control.
   * @returns A promise that resolves with the response data.
   * @template T - The expected response data type.
   */
  async get<T>(url: string, config?: AxiosRequestConfig & { useCache?: boolean }): Promise<T> {
    return this.transactionRunner.get<T>(url, config);
  }

  /**
   * Performs a POST request.
   *
   * @param url - The URL to request.
   * @param data - The data to send in the request body.
   * @param config - Optional request configuration.
   * @returns A promise that resolves with the response data.
   * @template T - The expected response data type.
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.transactionRunner.post<T>(url, data, config);
  }

  /**
   * Performs a PUT request.
   *
   * @param url - The URL to request.
   * @param data - The data to send in the request body.
   * @param config - Optional request configuration.
   * @returns A promise that resolves with the response data.
   * @template T - The expected response data type.
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.transactionRunner.put<T>(url, data, config);
  }

  /**
   * Performs a DELETE request.
   *
   * @param url - The URL to request.
   * @param config - Optional request configuration.
   * @returns A promise that resolves with the response data.
   * @template T - The expected response data type.
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.transactionRunner.delete<T>(url, config);
  }

  /**
   * Gets the current rate limit status.
   *
   * @returns An object containing the remaining requests and the reset time.
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getResetTime(),
    };
  }

  /**
   * Gets statistics about the cache performance.
   *
   * @returns An object containing cache statistics, including size, hits, misses, and hit rate.
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Performs a GET request to an external URL (not using the base URL).
   *
   * @param url - The full URL to request.
   * @param config - Optional request configuration.
   * @returns A promise that resolves with the response data.
   * @template T - The expected response data type.
   */
  async getExternal<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.transactionRunner.getExternal<T>(url, config);
  }

  /**
   * Clears the entire cache.
   */
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
