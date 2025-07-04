import axios from 'axios';
import { HttpClient } from '../../src/api/http-client';
import { PubgClientConfig } from '../../src/types/api';
import {
  PubgApiError,
  PubgRateLimitError,
  PubgAuthenticationError,
  PubgNotFoundError,
  PubgValidationError
} from '../../src/errors';

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
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn()
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    config = {
      apiKey: 'test-api-key',
      shard: 'pc-na',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 500
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
          'Authorization': 'Bearer test-api-key',
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/json'
        }
      });
    });

    it('should use custom base URL if provided', () => {
      const customConfig = { ...config, baseUrl: 'https://custom.api.com' };
      new HttpClient(customConfig);

      expect(mockedAxios.create).toHaveBeenLastCalledWith({
        baseURL: 'https://custom.api.com',
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/json'
        }
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

  describe('getRateLimitStatus', () => {
    it('should return rate limit status', () => {
      const status = httpClient.getRateLimitStatus();
      
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetTime');
      expect(typeof status.remaining).toBe('number');
      expect(typeof status.resetTime).toBe('number');
    });
  });
});