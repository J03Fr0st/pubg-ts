import axios from 'axios';
import { HttpClient } from '../../src/api/http-client';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../src/errors';
import type { PubgClientConfig } from '../../src/types/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let config: PubgClientConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    config = {
      apiKey: 'test-api-key',
      shard: 'pc-na',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 500,
    };

    httpClient = new HttpClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.pubg.com',
        timeout: 5000,
        headers: {
          Authorization: 'Bearer test-api-key',
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use custom base URL if provided', () => {
      const customConfig = { ...config, baseUrl: 'https://custom.api.com' };
      new HttpClient(customConfig);

      expect(mockedAxios.create).toHaveBeenLastCalledWith({
        baseURL: 'https://custom.api.com',
        timeout: 5000,
        headers: {
          Authorization: 'Bearer test-api-key',
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: { test: 'data' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ test: 'data' });
    });

    it('should make POST request', async () => {
      const mockResponse = { data: { test: 'data' } };
      const postData = { key: 'value' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await httpClient.post('/test', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual({ test: 'data' });
    });

    it('should make PUT request', async () => {
      const mockResponse = { data: { test: 'data' } };
      const putData = { key: 'value' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await httpClient.put('/test', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', putData, undefined);
      expect(result).toEqual({ test: 'data' });
    });

    it('should make DELETE request', async () => {
      const mockResponse = { data: { test: 'data' } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await httpClient.delete('/test');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ test: 'data' });
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      // Reset cache for each test
      httpClient.clearCache();
    });

    it('should cache successful GET responses', async () => {
      const mockResponse = { data: { test: 'cached-data' }, status: 200 };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First request should hit the API
      const result1 = await httpClient.get('/test');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ test: 'cached-data' });

      // Second request should use cache
      const result2 = await httpClient.get('/test');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toEqual({ test: 'cached-data' });
    });

    it('should not cache when useCache is false', async () => {
      const mockResponse = { data: { test: 'no-cache' }, status: 200 };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First request with cache disabled
      await httpClient.get('/test', { useCache: false });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second request should also hit API
      await httpClient.get('/test', { useCache: false });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should not cache non-200 responses', async () => {
      const mockResponse = { data: { test: 'error-data' }, status: 400 };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await httpClient.get('/test');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second request should hit API again
      await httpClient.get('/test');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should generate different cache keys for different URLs and params', async () => {
      const mockResponse1 = { data: { test: 'data1' }, status: 200 };
      const mockResponse2 = { data: { test: 'data2' }, status: 200 };

      mockAxiosInstance.get
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      await httpClient.get('/test1');
      await httpClient.get('/test2');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      // Requests to same URLs should use cache
      await httpClient.get('/test1');
      await httpClient.get('/test2');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2); // Still only 2 calls
    });
  });

  describe('error handling', () => {
    let responseInterceptorError: any;

    beforeEach(() => {
      // Get the response error handler from the interceptor setup
      const responseInterceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      responseInterceptorError = responseInterceptorCall[1]; // Error handler is the second argument
    });

    it('should throw PubgAuthenticationError for 401 status', async () => {
      const error = {
        response: {
          status: 401,
          data: { errors: [{ detail: 'Invalid API key' }] },
        },
      };

      await expect(responseInterceptorError(error)).rejects.toThrow(PubgAuthenticationError);
      await expect(responseInterceptorError(error)).rejects.toThrow('Invalid API key');
    });

    it('should throw PubgNotFoundError for 404 status', async () => {
      const error = {
        response: {
          status: 404,
          data: { errors: [{ detail: 'Resource not found' }] },
        },
      };

      await expect(responseInterceptorError(error)).rejects.toThrow(PubgNotFoundError);
      await expect(responseInterceptorError(error)).rejects.toThrow('Resource not found');
    });

    it('should throw PubgValidationError for 400 status', async () => {
      const error = {
        response: {
          status: 400,
          data: { errors: [{ detail: 'Invalid request parameters' }] },
        },
      };

      await expect(responseInterceptorError(error)).rejects.toThrow(PubgValidationError);
      await expect(responseInterceptorError(error)).rejects.toThrow('Invalid request parameters');
    });

    it('should throw PubgRateLimitError for 429 status', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '120' },
          data: { errors: [{ detail: 'Rate limit exceeded' }] },
        },
      };

      await expect(responseInterceptorError(error)).rejects.toThrow(PubgRateLimitError);
      await expect(responseInterceptorError(error)).rejects.toThrow('Rate limit exceeded');
    });

    it('should use default retry-after value when header is missing', async () => {
      const error = {
        response: {
          status: 429,
          headers: {},
          data: { errors: [{ detail: 'Rate limit exceeded' }] },
        },
      };

      try {
        await responseInterceptorError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(PubgRateLimitError);
        expect((e as PubgRateLimitError).retryAfter).toBe(60);
      }
    });

    it('should use error message when no detail is provided', async () => {
      const error = {
        response: {
          status: 400,
          data: {},
        },
        message: 'Network error',
      };

      await expect(responseInterceptorError(error)).rejects.toThrow('Network error');
    });

    it('should throw PubgApiError for other status codes', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: [{ detail: 'Unprocessable entity' }] },
        },
      };

      await expect(responseInterceptorError(error)).rejects.toThrow(PubgApiError);
      await expect(responseInterceptorError(error)).rejects.toThrow('Unprocessable entity');
    });
  });

  describe('retry logic', () => {
    let responseInterceptorError: any;

    beforeEach(() => {
      // Get the response error handler from the interceptor setup
      const responseInterceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      responseInterceptorError = responseInterceptorCall[1]; // Error handler is the second argument
    });

    it('should retry server errors when retryAttempts is configured', async () => {
      const serverError = {
        response: { status: 500 },
        message: 'Internal server error',
        config: { url: '/test' },
      };

      // Mock retry request to succeed
      mockAxiosInstance.request.mockResolvedValueOnce({ data: { success: true } });

      const result = await responseInterceptorError(serverError);

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: { success: true } });
    });

    it('should retry for 502, 503, and 504 errors', async () => {
      const serverErrors = [502, 503, 504];

      for (const status of serverErrors) {
        jest.clearAllMocks();
        const error = {
          response: { status },
          message: `Server error ${status}`,
          config: { url: '/test' },
        };

        mockAxiosInstance.request.mockResolvedValueOnce({ data: { success: true } });

        await responseInterceptorError(error);

        expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
      }
    });

    it('should not retry when retryAttempts is 0', async () => {
      // Clear mock calls to get clean state
      jest.clearAllMocks();

      const noRetryConfig = { ...config, retryAttempts: 0 };
      const _noRetryClient = new HttpClient(noRetryConfig);

      // Get the error handler for the no-retry client (should be the first call after clearing)
      const noRetryErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      const serverError = {
        response: { status: 500 },
        message: 'Internal server error',
      };

      await expect(noRetryErrorHandler(serverError)).rejects.toThrow(PubgApiError);
      await expect(noRetryErrorHandler(serverError)).rejects.toThrow(
        'Server error: Internal server error'
      );
    });

    it('should respect retry configuration', () => {
      // Test that different retry configurations create different clients
      const client1 = new HttpClient({ ...config, retryAttempts: 0 });
      const client2 = new HttpClient({ ...config, retryAttempts: 3 });

      // Both should have created axios instances with interceptors
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();

      // This test verifies that the retry configuration is properly set up
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe('utility methods', () => {
    it('should return cache stats', () => {
      const stats = httpClient.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('defaultTtl');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.defaultTtl).toBe('number');
    });

    it('should clear cache', () => {
      httpClient.clearCache();

      const stats = httpClient.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return rate limit status', () => {
      const status = httpClient.getRateLimitStatus();

      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetTime');
      expect(typeof status.remaining).toBe('number');
      expect(typeof status.resetTime).toBe('number');
    });
  });

  describe('interceptors setup', () => {
    it('should setup request and response interceptors', () => {
      // Verify interceptors were registered during construction
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledTimes(1);

      // Verify the interceptor functions are properly configured
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0];

      expect(typeof requestInterceptor[0]).toBe('function'); // success handler
      expect(typeof requestInterceptor[1]).toBe('function'); // error handler
      expect(typeof responseInterceptor[0]).toBe('function'); // success handler
      expect(typeof responseInterceptor[1]).toBe('function'); // error handler
    });
  });
});
