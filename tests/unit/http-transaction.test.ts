import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpTransactionRunner } from '../../src/api/http-transaction';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgCacheError,
  PubgNetworkError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../src/errors';
import type { PubgClientConfig } from '../../src/types/api';
import { MemoryCache } from '../../src/utils/cache';
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

const createError = (status?: number, code?: string) => ({
  code,
  config: { method: 'get', url: '/players' },
  message: status ? `Request failed with ${status}` : 'lookup failed',
  ...(status
    ? {
        response: {
          data: { errors: [{ detail: `Request failed with ${status}` }] },
          headers: status === 429 ? { 'retry-after': '120' } : {},
          status,
        },
      }
    : {}),
});

const createRunner = (
  request: jest.Mock<Promise<AxiosResponse>, [AxiosRequestConfig]>,
  overrides: Partial<PubgClientConfig> = {},
  dependencies: { cache?: MemoryCache; externalGet?: jest.Mock } = {}
) => {
  const rateLimiter = new RateLimiter(100, 60_000);
  const waitForSlot = jest.spyOn(rateLimiter, 'waitForSlot');
  const recordOutcome = jest.fn();
  const runner = new HttpTransactionRunner({
    cache: dependencies.cache ?? new MemoryCache(),
    config: { retryAttempts: 0, retryDelay: 0, timeout: 5000, ...overrides },
    deduplicator: new RequestDeduplicator(),
    externalGet: dependencies.externalGet ?? jest.fn(),
    rateLimiter,
    recordOutcome,
    request,
  });

  return { recordOutcome, runner, waitForSlot };
};

describe('HttpTransactionRunner', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('caches successful GET responses and records the network success then cache hit', async () => {
    const request = jest.fn().mockResolvedValue(createResponse({ value: 'cached' }));
    const { recordOutcome, runner } = createRunner(request);
    const config = { params: { playerNames: 'one' } };

    await expect(runner.get('/players', config)).resolves.toEqual({ value: 'cached' });
    await expect(runner.get('/players', config)).resolves.toEqual({ value: 'cached' });

    expect(request).toHaveBeenCalledTimes(1);
    expect(recordOutcome.mock.calls).toEqual([
      [{ kind: 'request_succeeded' }],
      [{ kind: 'cache_hit' }],
    ]);
  });

  it('bypasses cache when useCache is false', async () => {
    const request = jest
      .fn()
      .mockResolvedValueOnce(createResponse({ value: 'first' }))
      .mockResolvedValueOnce(createResponse({ value: 'second' }));
    const { recordOutcome, runner } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({ value: 'first' });
    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({ value: 'second' });

    expect(request).toHaveBeenCalledTimes(2);
    expect(recordOutcome).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent GET misses for the same cache key', async () => {
    let resolveRequest: (response: AxiosResponse) => void = () => {};
    const request: jest.Mock<Promise<AxiosResponse>, [AxiosRequestConfig]> = jest.fn(
      (_config: AxiosRequestConfig) =>
        new Promise<AxiosResponse>((resolve) => {
          resolveRequest = resolve;
        })
    );
    const { recordOutcome, runner } = createRunner(request);

    const first = runner.get('/players');
    const second = runner.get('/players');
    await new Promise((resolve) => setImmediate(resolve));
    resolveRequest(createResponse({ value: 'shared' }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { value: 'shared' },
      { value: 'shared' },
    ]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(recordOutcome).toHaveBeenCalledTimes(1);
  });

  it('records only the final successful outcome after a retry', async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce(createError(502))
      .mockResolvedValueOnce(createResponse({ value: 'retried' }));
    const { recordOutcome, runner, waitForSlot } = createRunner(request, {
      retryAttempts: 2,
      retryDelay: 0,
    });

    await expect(runner.get('/players', { useCache: false })).resolves.toEqual({
      value: 'retried',
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(waitForSlot).toHaveBeenCalledTimes(2);
    expect(recordOutcome).toHaveBeenCalledTimes(1);
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'request_succeeded' });
  });

  it('preserves error context and records one server failure after retries are exhausted', async () => {
    const request = jest.fn().mockRejectedValue(createError(502));
    const { recordOutcome, runner } = createRunner(request, {
      retryAttempts: 2,
      retryDelay: 0,
    });

    await expect(runner.get('/players', { useCache: false })).rejects.toMatchObject({
      context: { metadata: { method: 'get', statusCode: 502, url: '/players' } },
      networkOperation: 'request',
    });
    expect(request).toHaveBeenCalledTimes(3);
    expect(recordOutcome).toHaveBeenCalledTimes(1);
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'server_failed', statusCode: 502 });
  });

  it.each([
    [401, PubgAuthenticationError, { kind: 'authentication_failed', statusCode: 401 }],
    [400, PubgValidationError, { kind: 'request_rejected', statusCode: 400 }],
    [404, PubgNotFoundError, { kind: 'request_rejected', statusCode: 404 }],
    [429, PubgRateLimitError, { kind: 'rate_limited', statusCode: 429 }],
  ])('maps final HTTP %i errors and records their logical outcome', async (status, ErrorType, outcome) => {
    const request = jest.fn().mockRejectedValue(createError(status as number));
    const { recordOutcome, runner } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).rejects.toBeInstanceOf(ErrorType);
    expect(recordOutcome).toHaveBeenCalledTimes(1);
    expect(recordOutcome).toHaveBeenCalledWith(outcome);
  });

  it('uses the default retry delay when Retry-After is not numeric', async () => {
    const request = jest.fn().mockRejectedValue({
      config: { method: 'get', url: '/players' },
      message: 'Rate limited',
      response: {
        data: { errors: [{ detail: 'Rate limited' }] },
        headers: { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' },
        status: 429,
      },
    });
    const runner = createRunner(request).runner;

    const error = await runner.get('/players', { useCache: false }).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgRateLimitError);
    expect((error as PubgRateLimitError).retryAfter).toBe(60);
  });

  it('maps network failures and records one network outcome', async () => {
    const request = jest.fn().mockRejectedValue(createError(undefined, 'ENOTFOUND'));
    const { recordOutcome, runner } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).rejects.toThrow(PubgNetworkError);
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'network_failed' });
  });

  it('maps non-Error adapter rejections without bypassing outcome recording', async () => {
    const request = jest.fn().mockRejectedValue(null);
    const { recordOutcome, runner } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).rejects.toThrow(PubgNetworkError);
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'network_failed' });
  });

  it('does not retain authenticated request credentials on public network errors', async () => {
    const requestError = Object.assign(new Error('lookup failed'), {
      code: 'ENOTFOUND',
      config: {
        headers: { Authorization: 'Bearer test-api-key' },
        method: 'get',
        url: '/players',
      },
    });
    const runner = createRunner(jest.fn().mockRejectedValue(requestError)).runner;

    const error = await runner.get('/players', { useCache: false }).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgNetworkError);
    expect((error as PubgNetworkError).originalError).toBeUndefined();
    expect(JSON.stringify(error)).not.toContain('test-api-key');
  });

  it('does not retain authenticated request credentials on public server errors', async () => {
    const requestError = {
      ...createError(503),
      config: {
        headers: { Authorization: 'Bearer test-api-key' },
        method: 'get',
        url: '/players',
      },
    };
    const runner = createRunner(jest.fn().mockRejectedValue(requestError)).runner;

    const error = await runner.get('/players', { useCache: false }).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgNetworkError);
    expect((error as PubgNetworkError).originalError).toBeUndefined();
    expect(JSON.stringify(error)).not.toContain('test-api-key');
  });

  it('records other client HTTP failures as rejected requests', async () => {
    const request = jest.fn().mockRejectedValue(createError(403));
    const { recordOutcome, runner } = createRunner(request);

    await expect(runner.get('/players', { useCache: false })).rejects.toBeInstanceOf(PubgApiError);
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'request_rejected', statusCode: 403 });
  });

  it('maps external network failures and records their outcome', async () => {
    const externalGet = jest.fn().mockRejectedValue(createError(undefined, 'ETIMEDOUT'));
    const { recordOutcome, runner } = createRunner(jest.fn(), {}, { externalGet });

    await expect(runner.getExternal('https://telemetry.test/match')).rejects.toMatchObject({
      networkOperation: 'timeout',
    });
    expect(externalGet).toHaveBeenCalledWith(
      'https://telemetry.test/match',
      expect.objectContaining({ method: 'get', timeout: 5000, url: 'https://telemetry.test/match' })
    );
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'network_failed' });
  });

  it('throws cache get failures and ignores cache set failures', async () => {
    const getFailureCache = new MemoryCache();
    jest.spyOn(getFailureCache, 'get').mockImplementation(() => {
      throw new Error('get failed');
    });
    const getFailureRunner = createRunner(jest.fn(), {}, { cache: getFailureCache }).runner;
    await expect(getFailureRunner.get('/players')).rejects.toThrow(PubgCacheError);

    const setFailureCache = new MemoryCache();
    jest.spyOn(setFailureCache, 'set').mockImplementation(() => {
      throw new Error('set failed');
    });
    const request = jest.fn().mockResolvedValue(createResponse({ value: 'ok' }));
    const setFailureRunner = createRunner(request, {}, { cache: setFailureCache }).runner;
    await expect(setFailureRunner.get('/players')).resolves.toEqual({ value: 'ok' });
  });
});
