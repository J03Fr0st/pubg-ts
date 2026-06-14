import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { HttpClient } from '../../src/api/http-client';
import { PubgConfigurationError } from '../../src/errors';
import type { PubgClientConfig } from '../../src/types/api';
import type { ObservabilitySpan, RuntimeObservability } from '../../src/utils/observability';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const createResponse = <T>(
  data: T,
  status = 200,
  config: AxiosRequestConfig = { method: 'get', url: '/test' }
): AxiosResponse<T> => ({
  config: config as AxiosResponse<T>['config'],
  data,
  headers: {},
  status,
  statusText: String(status),
});

const createFakeObservability = () => {
  const span: jest.Mocked<ObservabilitySpan> = {
    end: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
  };

  const observability: jest.Mocked<RuntimeObservability> = {
    cleanup: jest.fn(),
    getHealth: jest.fn(),
    getMetrics: jest.fn(),
    recordError: jest.fn(),
    recordRequestMetrics: jest.fn(),
    startSpan: jest.fn().mockReturnValue(span),
    shutdown: jest.fn(),
    updateCacheMetrics: jest.fn(),
    updateConnectionMetrics: jest.fn(),
    updateRateLimitMetrics: jest.fn(),
  };

  return observability;
};

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let config: PubgClientConfig;
  let mockAxiosInstance: { request: jest.Mock };

  beforeEach(() => {
    mockAxiosInstance = {
      request: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as AxiosInstance);
    mockedAxios.get = jest.fn();

    config = {
      apiKey: 'test-api-key',
      retryAttempts: 2,
      retryDelay: 0,
      shard: 'pc-na',
      timeout: 5000,
    };

    httpClient = new HttpClient(config, createFakeObservability());
    httpClient.clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates axios instance with default PUBG API config', () => {
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

    it('uses custom base URL when provided', () => {
      new HttpClient({ ...config, baseUrl: 'https://custom.api.com' }, createFakeObservability());

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

    it('validates required configuration', () => {
      expect(() => new HttpClient({ ...config, apiKey: '' }, createFakeObservability())).toThrow(
        PubgConfigurationError
      );
      expect(
        () =>
          new HttpClient(
            { ...config, shard: '' as unknown as PubgClientConfig['shard'] },
            createFakeObservability()
          )
      ).toThrow(PubgConfigurationError);
    });
  });

  describe('HTTP methods', () => {
    it('performs GET through the transaction runner', async () => {
      mockAxiosInstance.request.mockResolvedValue(
        createResponse({ test: 'data' }, 200, { method: 'get', url: '/test' })
      );

      const result = await httpClient.get('/test', { useCache: false });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'get', url: '/test', useCache: false })
      );
      expect(result).toEqual({ test: 'data' });
    });

    it('performs POST through the transaction runner', async () => {
      const postData = { key: 'value' };
      mockAxiosInstance.request.mockResolvedValue(
        createResponse({ test: 'data' }, 200, { method: 'post', url: '/test' })
      );

      const result = await httpClient.post('/test', postData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ data: postData, method: 'post', url: '/test' })
      );
      expect(result).toEqual({ test: 'data' });
    });

    it('performs PUT through the transaction runner', async () => {
      const putData = { key: 'value' };
      mockAxiosInstance.request.mockResolvedValue(
        createResponse({ test: 'data' }, 200, { method: 'put', url: '/test' })
      );

      const result = await httpClient.put('/test', putData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ data: putData, method: 'put', url: '/test' })
      );
      expect(result).toEqual({ test: 'data' });
    });

    it('performs DELETE through the transaction runner', async () => {
      mockAxiosInstance.request.mockResolvedValue(
        createResponse({ test: 'data' }, 200, { method: 'delete', url: '/test' })
      );

      const result = await httpClient.delete('/test');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'delete', url: '/test' })
      );
      expect(result).toEqual({ test: 'data' });
    });

    it('performs external GET with the configured timeout', async () => {
      mockedAxios.get.mockResolvedValue(createResponse({ external: true }));

      const result = await httpClient.getExternal('https://example.test/data', {
        headers: { Accept: 'application/json' },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.test/data', {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });
      expect(result).toEqual({ external: true });
    });
  });

  describe('utility methods', () => {
    it('returns cache stats', () => {
      const stats = httpClient.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('defaultTtl');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.defaultTtl).toBe('number');
    });

    it('clears cache', async () => {
      mockAxiosInstance.request.mockResolvedValue(
        createResponse({ test: 'cached' }, 200, { method: 'get', url: '/test' })
      );

      await httpClient.get('/test');
      httpClient.clearCache();

      expect(httpClient.getCacheStats().size).toBe(0);
    });

    it('returns rate limit status', () => {
      const status = httpClient.getRateLimitStatus();

      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetTime');
      expect(typeof status.remaining).toBe('number');
      expect(typeof status.resetTime).toBe('number');
    });
  });
});
