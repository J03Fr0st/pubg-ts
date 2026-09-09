jest.unmock('axios');

import axios, { type AxiosAdapter, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { endpointTarget } from '../../../src/api/endpoint-query';
import { ClientRuntime } from '../../../src/api/runtime/client-runtime';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgConfigurationError,
  PubgNetworkError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../../src/errors';

import {
  runtimeConfig as config,
  createAuthenticatedNetworkError,
  createError,
  createResponse,
  createSecretTelemetryError,
  expectTelemetryErrorRedacted,
  PLAYERS_TARGET,
  SECRET_TELEMETRY_URL,
  withLocalServer,
} from './runtime-test-helpers';

describe('ClientRuntime isolation', () => {
  it('does not share cached responses between clients', async () => {
    const first = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse({ origin: 'one' })),
      baseUrl: 'https://one.test',
    });
    const second = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse({ origin: 'two' })),
      baseUrl: 'https://two.test',
    });

    await expect(first.get(PLAYERS_TARGET)).resolves.toEqual({ origin: 'one' });
    await expect(second.get(PLAYERS_TARGET)).resolves.toEqual({ origin: 'two' });
    expect(first.getHealth().responseCache.size).toBe(1);
    expect(second.getHealth().responseCache.size).toBe(1);
  });

  it('clears only the owning response cache', async () => {
    const first = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse(1)),
    });
    const second = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse(2)),
    });
    await first.get(PLAYERS_TARGET);
    await second.get(PLAYERS_TARGET);
    first.clearResponseCache();
    expect(first.getHealth().responseCache.size).toBe(0);
    expect(second.getHealth().responseCache.size).toBe(1);
  });
});

describe('ClientRuntime transactions', () => {
  it('serves repeats from the response cache without touching the network', async () => {
    const request = jest.fn().mockResolvedValue(createResponse({ value: 'cached' }));
    const runtime = ClientRuntime.forTest({ request });

    await expect(runtime.get(PLAYERS_TARGET)).resolves.toEqual({ value: 'cached' });
    await expect(runtime.get(PLAYERS_TARGET)).resolves.toEqual({ value: 'cached' });

    expect(request).toHaveBeenCalledTimes(1);
    expect(runtime.getHealth()).toMatchObject({
      requests: { attempted: 2, succeeded: 2, failed: 0 },
      responseCache: { size: 1, hits: 1 },
    });
  });

  it('deduplicates concurrent misses for the same target', async () => {
    let resolveRequest: ((response: any) => void) | undefined;
    const request = jest.fn(
      () =>
        new Promise<any>((resolve) => {
          resolveRequest = resolve;
        })
    );
    const runtime = ClientRuntime.forTest({ request });

    const first = runtime.get(PLAYERS_TARGET);
    const second = runtime.get(PLAYERS_TARGET);
    await new Promise((resolve) => setImmediate(resolve));
    resolveRequest?.(createResponse({ value: 'shared' }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { value: 'shared' },
      { value: 'shared' },
    ]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(runtime.getHealth().requests).toEqual({ attempted: 1, succeeded: 1, failed: 0 });
  });

  it('records one successful outcome after a retried request', async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce(createError(502))
      .mockResolvedValueOnce(createResponse({ value: 'retried' }));
    const runtime = ClientRuntime.forTest({ request, retryAttempts: 2, retryDelay: 0 });

    await expect(runtime.get(PLAYERS_TARGET)).resolves.toEqual({ value: 'retried' });

    expect(request).toHaveBeenCalledTimes(2);
    expect(runtime.getHealth()).toMatchObject({
      status: 'healthy',
      requests: { attempted: 1, succeeded: 1, failed: 0 },
      rateLimit: { remaining: 8 },
    });
  });

  it('preserves error context and records one server failure after retries are exhausted', async () => {
    const request = jest.fn().mockRejectedValue(createError(502));
    const runtime = ClientRuntime.forTest({ request, retryAttempts: 2, retryDelay: 0 });

    await expect(runtime.get(PLAYERS_TARGET)).rejects.toMatchObject({
      context: { metadata: { method: 'get', statusCode: 502, url: PLAYERS_TARGET } },
      networkOperation: 'request',
    });
    expect(request).toHaveBeenCalledTimes(3);
    expect(runtime.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'server_failed',
      statusCode: 502,
      requests: { attempted: 1, succeeded: 0, failed: 1 },
    });
  });

  it.each([
    [401, PubgAuthenticationError, 'authentication_failed', 'unhealthy'],
    [400, PubgValidationError, 'not_observed', 'unknown'],
    [404, PubgNotFoundError, 'not_observed', 'unknown'],
    [429, PubgRateLimitError, 'rate_limited', 'degraded'],
  ])('maps final HTTP %i errors to their typed error and health outcome', async (status, ErrorType, reason, statusName) => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(createError(status as number)),
    });

    await expect(runtime.get(PLAYERS_TARGET)).rejects.toBeInstanceOf(ErrorType);
    expect(runtime.getHealth()).toMatchObject({ status: statusName, reason });
  });

  it('falls back to the default retry delay when Retry-After is not numeric', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue({
        config: { method: 'get', url: PLAYERS_TARGET },
        message: 'Rate limited',
        response: {
          data: { errors: [{ detail: 'Rate limited' }] },
          headers: { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' },
          status: 429,
        },
      }),
    });

    const error = await runtime.get(PLAYERS_TARGET).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgRateLimitError);
    expect((error as PubgRateLimitError).retryAfter).toBe(60);
  });

  it('maps network failures, including non-Error rejections, to one network outcome', async () => {
    const networkRuntime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(createError(undefined, 'ENOTFOUND')),
    });
    await expect(networkRuntime.get(PLAYERS_TARGET)).rejects.toMatchObject({
      networkOperation: 'dns',
    });
    expect(networkRuntime.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'network_failed',
    });

    const nullRuntime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(null),
    });
    await expect(nullRuntime.get(PLAYERS_TARGET)).rejects.toThrow(PubgNetworkError);
    expect(nullRuntime.getHealth()).toMatchObject({ reason: 'network_failed' });
  });

  it('does not retain authenticated request credentials on public errors', async () => {
    const requestError = createAuthenticatedNetworkError();
    const networkRuntime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(requestError),
    });

    const networkFailure = await networkRuntime.get(PLAYERS_TARGET).catch((caught) => caught);

    expect(networkFailure).toBeInstanceOf(PubgNetworkError);
    expect((networkFailure as PubgNetworkError).originalError).toBeUndefined();
    expect(JSON.stringify(networkFailure)).not.toContain('test-api-key');

    const serverRuntime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue({
        ...createError(503),
        config: {
          headers: { Authorization: 'Bearer test-api-key' },
          method: 'get',
          url: PLAYERS_TARGET,
        },
      }),
    });

    const serverFailure = await serverRuntime.get(PLAYERS_TARGET).catch((caught) => caught);

    expect(serverFailure).toBeInstanceOf(PubgNetworkError);
    expect((serverFailure as PubgNetworkError).originalError).toBeUndefined();
    expect(JSON.stringify(serverFailure)).not.toContain('test-api-key');
  });

  it('records other client HTTP failures as rejected requests', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(createError(403)),
    });

    await expect(runtime.get(PLAYERS_TARGET)).rejects.toBeInstanceOf(PubgApiError);
    expect(runtime.getHealth()).toMatchObject({ status: 'unknown', reason: 'not_observed' });
  });
});

describe('ClientRuntime Match Telemetry', () => {
  it('fetches telemetry without authorization or response caching', async () => {
    const fetchTelemetry = jest.fn().mockResolvedValue({ data: [{ _T: 'LogMatchStart' }] });
    const runtime = ClientRuntime.forTest({ request: jest.fn(), fetchTelemetry, timeout: 5000 });

    await runtime.fetchTelemetry('https://telemetry.test/match-1');

    expect(fetchTelemetry).toHaveBeenCalledWith('https://telemetry.test/match-1', {
      method: 'get',
      timeout: 5000,
      url: 'https://telemetry.test/match-1',
    });
    expect(runtime.getHealth()).toMatchObject({
      status: 'unknown',
      requests: { attempted: 1, succeeded: 1, failed: 0 },
      responseCache: { size: 0 },
    });
  });

  it('maps telemetry failures before recording one network failure', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      fetchTelemetry: jest.fn().mockRejectedValue(createError(undefined, 'ENOTFOUND')),
      now: () => new Date('2026-07-13T15:00:00.000Z'),
    });

    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toMatchObject({
      networkOperation: 'dns',
    });
    expect(runtime.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'network_failed',
      transitionedAt: '2026-07-13T15:00:00.000Z',
      requests: { attempted: 1, succeeded: 0, failed: 1 },
    });
  });

  it('redacts secret-bearing telemetry network failures from every public error surface', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      fetchTelemetry: jest
        .fn()
        .mockRejectedValue(createSecretTelemetryError(undefined, 'ENOTFOUND')),
    });

    const error = await runtime.fetchTelemetry(SECRET_TELEMETRY_URL).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgNetworkError);
    expectTelemetryErrorRedacted(error as PubgNetworkError);
    expect((error as PubgNetworkError).originalError).toBeUndefined();
    expect(runtime.getHealth()).toMatchObject({ status: 'degraded', reason: 'network_failed' });
  });

  it('redacts secret-bearing telemetry HTTP failures while preserving typed health mapping', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      fetchTelemetry: jest.fn().mockRejectedValue(createSecretTelemetryError(401)),
    });

    const error = await runtime.fetchTelemetry(SECRET_TELEMETRY_URL).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgAuthenticationError);
    expectTelemetryErrorRedacted(error as PubgAuthenticationError);
    expect(runtime.getHealth()).toMatchObject({
      status: 'unhealthy',
      reason: 'authentication_failed',
      statusCode: 401,
    });
  });

  it.each([
    [400, PubgValidationError],
    [404, PubgNotFoundError],
  ])('preserves prior health when telemetry returns %i', async (status, ErrorType) => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse({ ok: true })),
      fetchTelemetry: jest.fn().mockRejectedValue(createError(status)),
      now: () => new Date('2026-07-13T15:00:00.000Z'),
    });

    await runtime.get(PLAYERS_TARGET);
    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      ErrorType
    );
    expect(runtime.getHealth()).toMatchObject({
      status: 'healthy',
      reason: 'request_succeeded',
      requests: { attempted: 2, succeeded: 1, failed: 1 },
    });
  });

  it('records telemetry 429 and 5xx as degraded outcomes', async () => {
    const rateLimited = ClientRuntime.forTest({
      request: jest.fn(),
      fetchTelemetry: jest.fn().mockRejectedValue(createError(429)),
    });
    await expect(rateLimited.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      PubgRateLimitError
    );
    expect(rateLimited.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'rate_limited',
      statusCode: 429,
    });

    const serverFailed = ClientRuntime.forTest({
      request: jest.fn(),
      fetchTelemetry: jest.fn().mockRejectedValue(createError(503)),
    });
    await expect(serverFailed.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      PubgNetworkError
    );
    expect(serverFailed.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'server_failed',
      statusCode: 503,
    });
  });

  it('does not recover upstream failure health after telemetry succeeds', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(createError(401)),
      fetchTelemetry: jest.fn().mockResolvedValue({ data: [{ _T: 'LogMatchStart' }] }),
    });

    await expect(runtime.get(PLAYERS_TARGET)).rejects.toThrow(PubgAuthenticationError);
    await runtime.fetchTelemetry('https://telemetry.test/match-1');
    expect(runtime.getHealth()).toMatchObject({
      status: 'unhealthy',
      reason: 'authentication_failed',
      requests: { attempted: 2, succeeded: 1, failed: 1 },
    });
  });
});

describe('ClientRuntime construction', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves every optional setting to the documented default', () => {
    const create = jest.spyOn(axios, 'create');

    new ClientRuntime({ apiKey: 'test-api-key', shard: 'steam' });

    expect(create).toHaveBeenCalledWith({
      baseURL: 'https://api.pubg.com',
      timeout: 10_000,
      headers: {
        Authorization: 'Bearer test-api-key',
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });
  });

  it('uses a custom base URL and timeout when provided', () => {
    const create = jest.spyOn(axios, 'create');

    new ClientRuntime({ ...config, baseUrl: 'https://custom.api.test' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://custom.api.test' })
    );
  });

  it('validates required configuration', () => {
    expect(() => new ClientRuntime({ ...config, apiKey: '' })).toThrow(PubgConfigurationError);
    expect(() => new ClientRuntime({ ...config, shard: '' as typeof config.shard })).toThrow(
      PubgConfigurationError
    );
  });

  it('rejects shards outside the canonical PUBG shard set', () => {
    expect(() => new ClientRuntime({ ...config, shard: 'steam/../matches' as any })).toThrow(
      PubgConfigurationError
    );
  });

  it.each([
    0,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects an invalid provided timeout: %p', (timeout) => {
    expect(() => new ClientRuntime({ ...config, timeout })).toThrow(PubgConfigurationError);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects non-finite retry attempts: %p', (retryAttempts) => {
    expect(() => new ClientRuntime({ ...config, retryAttempts })).toThrow(PubgConfigurationError);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects a non-finite retry delay: %p', (retryDelay) => {
    expect(() => new ClientRuntime({ ...config, retryDelay })).toThrow(PubgConfigurationError);
  });

  it('sends authenticated requests with PUBG headers through the production adapter', async () => {
    await withLocalServer(async (baseUrl, seen) => {
      const runtime = new ClientRuntime({ apiKey: 'pubg-key', shard: 'steam', baseUrl });

      await expect(
        runtime.get(endpointTarget('steam', ['players'], { 'filter[playerNames]': 'shroud' }))
      ).resolves.toEqual({ served: true });

      expect(seen.authorization).toBe('Bearer pubg-key');
      expect(seen.path).toBe('/shards/steam/players');
      expect(seen.query).toBe('filter%5BplayerNames%5D=shroud');
    });
  });

  it('allows only telemetry response headers through the final adapter request', async () => {
    const credentialHeaders = ['Authorization', 'Cookie', 'Proxy-Authorization', 'X-API-Key'];
    const originalHeaders = Object.fromEntries(
      credentialHeaders.map((name) => [name, axios.defaults.headers.common[name]])
    );
    const originalAdapter = axios.defaults.adapter;
    const finalAdapter = jest.fn(async (requestConfig: InternalAxiosRequestConfig) => ({
      config: requestConfig,
      data: [{ _T: 'LogMatchStart' }],
      headers: {},
      status: 200,
      statusText: 'OK',
    }));

    try {
      for (const name of credentialHeaders) {
        axios.defaults.headers.common[name] = `${name} global-secret`;
      }
      axios.defaults.adapter = finalAdapter as AxiosAdapter;
      const runtime = new ClientRuntime({ apiKey: 'pubg-key', shard: 'steam' });

      await runtime.fetchTelemetry('https://telemetry.test/match-1');

      expect(finalAdapter).toHaveBeenCalledTimes(1);
      const finalConfig = finalAdapter.mock.calls[0][0];
      const headers = AxiosHeaders.from(finalConfig.headers);
      expect(headers.get('Accept')).toBe('application/json');
      for (const name of credentialHeaders) {
        expect(headers.has(name)).toBe(false);
      }
    } finally {
      for (const name of credentialHeaders) {
        const original = originalHeaders[name];
        if (original === undefined) {
          delete axios.defaults.headers.common[name];
        } else {
          axios.defaults.headers.common[name] = original;
        }
      }
      axios.defaults.adapter = originalAdapter;
    }
  });

  it('does not send Basic authorization from a global Axios auth default', async () => {
    const originalAuth = axios.defaults.auth;
    try {
      axios.defaults.auth = { username: 'global-user', password: 'global-password' };
      await withLocalServer(async (baseUrl, seen) => {
        const runtime = new ClientRuntime({ apiKey: 'pubg-key', shard: 'steam' });
        await runtime.fetchTelemetry(`${baseUrl}/telemetry`);
        expect(seen.authorization).toBeUndefined();
      });
    } finally {
      if (originalAuth === undefined) {
        delete axios.defaults.auth;
      } else {
        axios.defaults.auth = originalAuth;
      }
    }
  });
});
