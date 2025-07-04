import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../errors';
import type { PubgClientConfig } from '../types/api';
import { RateLimiter } from '../utils/rate-limiter';

export class HttpClient {
  private axios: AxiosInstance;
  private rateLimiter: RateLimiter;
  private config: PubgClientConfig;

  constructor(config: PubgClientConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(10, 60000);

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

        switch (status) {
          case 401:
            throw new PubgAuthenticationError(message);
          case 404:
            throw new PubgNotFoundError(message);
          case 400:
            throw new PubgValidationError(message);
          case 429: {
            const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60');
            throw new PubgRateLimitError(message, retryAfter);
          }
          case 500:
          case 502:
          case 503:
          case 504:
            if (this.config.retryAttempts && this.config.retryAttempts > 0) {
              return this.retryRequest(error);
            }
            throw new PubgApiError(`Server error: ${message}`, status);
          default:
            throw new PubgApiError(message, status, error.response?.data);
        }
      }
    );
  }

  private async retryRequest(error: any, attempt: number = 1): Promise<AxiosResponse> {
    if (attempt > (this.config.retryAttempts || 3)) {
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

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
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
}
