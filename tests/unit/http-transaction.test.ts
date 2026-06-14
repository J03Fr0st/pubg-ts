import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpTransactionRunner } from '../../src/api/http-transaction';
import {
  PubgAuthenticationError,
  PubgCacheError,
  PubgNetworkError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../src/errors';
import type { PubgClientConfig } from '../../src/types/api';
import { MemoryCache } from '../../src/utils/cache';
import type { ObservabilitySpan, RuntimeObservability } from '../../src/utils/observability';
import { RateLimiter } from '../../src/utils/rate-limiter';
import { RequestDeduplicator } from '../../src/utils/request';

const createResponse = <T>(
  data: T,
  status = 200,
  config: AxiosRequestConfig = { method: 'get', url: '/players' },
  headers: Record<string, string> = {}
): AxiosResponse<T> => ({
  config: config as AxiosResponse<T>['config'],
  data,
  headers,
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

  return { observability, span };
};

const createRunner = (
  request: jest.Mock<Promise<AxiosResponse>, [AxiosRequestConfig]>,
  overrides: Partial<PubgClientConfig> = {}
) => {
  const dependencies = createDependencies(request, overrides);
  const runner = new HttpTransactionRunner(dependencies);

  return { ...dependencies, runner };
};

const createDependencies = (
  request: jest.Mock<Promise<AxiosResponse>, [AxiosRequestConfig]>,
  overrides: Partial<PubgClientConfig> = {}
) => {
  const { observability, span } = createFakeObservability();
  const rateLimiter = new RateLimiter(100, 60000);
  const waitForSlot = jest.spyOn(rateLimiter, 'waitForSlot');

  const config: PubgClientConfig = {
    apiKey: 'test-api-key',
    retryAttempts: 0,
    retryDelay: 0,
    shard: 'pc-na',
    timeout: 5000,
    ...overrides,
  };

  return {
    cache: new MemoryCache(),
    config,
    deduplicator: new RequestDeduplicator(),
    observability,
    rateLimiter,
    request,
    span,
    waitForSlot,
  };
};

describe('HttpTransactionRunner', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('caches successful GET responses by URL and params', async () => {
    const request = jest.fn().mockResolvedValue(createResponse({ value: 'cached' }));
    const { runner } = createRunner(request);
    const config = { params: { playerNames: 'one' } };

    await expect(runner.get('/players', config)).resolves.toEqual({ value: 'cached' });
    await expect(runner.get('/players', config)).resolves.toEqual({ value: 'cached' });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'get', url: '/players' })
    );
  });

  it('bypasses cache when useCache is false', async () => {
    const request = jest
      .fn()
      .mockResolvedValueOnce(createResponse({ value: 'first' }))
      .mockResolvedValueOnce(createResponse({ value: 'second' }));
    const { runner } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({ value: 'first' });
    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({ value: 'second' });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent GET misses for the same cache key', async () => {
    let resolveRequest: (response: AxiosResponse) => void = () => {};
    const request: jest.Mock<Promise<AxiosResponse>, [AxiosRequestConfig]> = jest.fn(
      (_config) =>
        new Promise<AxiosResponse>((resolve) => {
          resolveRequest = resolve;
        })
    );
    const { runner } = createRunner(request);

    const first = runner.get('/players', { params: { playerNames: 'one' } });
    const second = runner.get('/players', { params: { playerNames: 'one' } });

    await new Promise((resolve) => setImmediate(resolve));
    resolveRequest(createResponse({ value: 'shared' }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { value: 'shared' },
      { value: 'shared' },
    ]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('retries configured server errors with exponential backoff', async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce({
        config: { method: 'get', url: '/players' },
        message: 'Bad gateway',
        response: { data: { errors: [{ detail: 'Bad gateway' }] }, status: 502 },
      })
      .mockResolvedValueOnce(createResponse({ value: 'retried' }));
    const { runner } = createRunner(request, { retryAttempts: 2, retryDelay: 0 });

    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({
      value: 'retried',
    });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('preserves server error context after configured retries are exhausted', async () => {
    const request = jest.fn().mockRejectedValue({
      config: { method: 'get', url: '/players' },
      message: 'Bad gateway',
      response: { data: { errors: [{ detail: 'Bad gateway' }] }, status: 502 },
    });
    const { runner } = createRunner(request, { retryAttempts: 2, retryDelay: 0 });

    await expect(runner.get('/players', { useCache: false })).rejects.toMatchObject({
      context: { metadata: { method: 'get', statusCode: 502, url: '/players' } },
      networkOperation: 'request',
    });
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('maps response errors and records observability failure events', async () => {
    const error = {
      config: { method: 'get', url: '/players' },
      message: 'Invalid request',
      response: { data: { errors: [{ detail: 'Invalid request' }] }, status: 400 },
    };
    const request = jest.fn().mockRejectedValue(error);
    const { observability, runner, span } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).rejects.toThrow(PubgValidationError);

    expect(observability.recordRequestMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/players',
        error: true,
        method: 'GET',
        statusCode: 400,
      })
    );
    expect(observability.recordError).toHaveBeenCalledWith(error, {
      endpoint: '/players',
      method: 'get',
      statusCode: 400,
    });
    expect(span.recordException).toHaveBeenCalledWith(error);
    expect(span.setStatus).toHaveBeenCalledWith({ code: 2, message: 'Invalid request' });
    expect(span.end).toHaveBeenCalledTimes(1);
  });

  it('maps authentication, rate limit, and network failures', async () => {
    const authRequest = jest.fn().mockRejectedValue({
      config: { method: 'get', url: '/players' },
      message: 'Unauthorized',
      response: { data: { errors: [{ detail: 'Unauthorized' }] }, status: 401 },
    });
    const rateLimitRequest = jest.fn().mockRejectedValue({
      config: { method: 'get', url: '/players' },
      message: 'Too many requests',
      response: {
        data: { errors: [{ detail: 'Too many requests' }] },
        headers: { 'retry-after': '120' },
        status: 429,
      },
    });
    const networkRequest = jest.fn().mockRejectedValue({
      code: 'ENOTFOUND',
      config: { method: 'get', url: '/players' },
      message: 'lookup failed',
    });

    await expect(
      createRunner(authRequest).runner.get('/players', { useCache: false })
    ).rejects.toThrow(PubgAuthenticationError);
    await expect(
      createRunner(rateLimitRequest).runner.get('/players', { useCache: false })
    ).rejects.toThrow(PubgRateLimitError);
    await expect(
      createRunner(networkRequest).runner.get('/players', { useCache: false })
    ).rejects.toThrow(PubgNetworkError);
  });

  it('updates rate-limit metrics and records successful request metrics', async () => {
    const request = jest
      .fn()
      .mockResolvedValue(
        createResponse({ value: 'ok' }, 200, undefined, { 'x-ratelimit-remaining': '7' })
      );
    const { observability, runner, span, waitForSlot } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({ value: 'ok' });

    expect(waitForSlot).toHaveBeenCalledTimes(1);
    expect(observability.startSpan).toHaveBeenCalledWith('http_request', {
      endpoint: '/players',
      method: 'GET',
      url: '/players',
    });
    expect(observability.recordRequestMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/players',
        error: false,
        method: 'GET',
        statusCode: 200,
      })
    );
    expect(observability.updateRateLimitMetrics).toHaveBeenCalledWith(7);
    expect(span.setStatus).toHaveBeenCalledWith({ code: 1 });
    expect(span.end).toHaveBeenCalledTimes(1);
  });

  it('throws cache get failures and ignores cache set failures', async () => {
    const getFailureCache = new MemoryCache();
    jest.spyOn(getFailureCache, 'get').mockImplementation(() => {
      throw new Error('get failed');
    });
    const getFailureRunner = new HttpTransactionRunner({
      ...createDependencies(jest.fn()),
      cache: getFailureCache,
    });

    await expect(getFailureRunner.get('/players')).rejects.toThrow(PubgCacheError);

    const setFailureCache = new MemoryCache();
    jest.spyOn(setFailureCache, 'set').mockImplementation(() => {
      throw new Error('set failed');
    });
    const request = jest.fn().mockResolvedValue(createResponse({ value: 'ok' }));
    const setFailureRunner = new HttpTransactionRunner({
      ...createDependencies(request),
      cache: setFailureCache,
      request,
    });

    await expect(setFailureRunner.get('/players')).resolves.toEqual({ value: 'ok' });
  });
});
