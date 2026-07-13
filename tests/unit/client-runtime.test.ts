import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { ClientRuntime } from '../../src/api/client-runtime';
import {
  type PubgApiError,
  PubgAuthenticationError,
  PubgConfigurationError,
  PubgNetworkError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../src/errors';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
Object.defineProperty(mockedAxios, 'defaults', {
  configurable: true,
  value: { adapter: jest.fn(), headers: { common: {} } },
  writable: true,
});
mockedAxios.getAdapter = jest.fn();

const resetAxiosMock = (): void => {
  mockedAxios.create.mockReset();
  mockedAxios.getAdapter.mockReset();
  mockedAxios.getAdapter.mockReturnValue(jest.fn());
  mockedAxios.create.mockReturnValue({ request: jest.fn() } as unknown as AxiosInstance);
};

const createResponse = <T>(
  data: T,
  config: AxiosRequestConfig = { method: 'get', url: '/test' }
): AxiosResponse<T> => ({
  config: config as AxiosResponse<T>['config'],
  data,
  headers: {},
  status: 200,
  statusText: '200',
});

const createExternalError = (status?: number, code?: string) => ({
  code,
  config: { method: 'get', url: 'https://telemetry.test/match-1' },
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

const SECRET_TELEMETRY_URL = 'https://telemetry.test/match?token=secret';
const TELEMETRY_SECRET_MARKERS = [
  SECRET_TELEMETRY_URL,
  'telemetry.test',
  'token',
  'secret',
  'request-config-secret',
  'response-config-secret',
];

const createSecretExternalError = (status?: number, code?: string) => {
  const config = {
    headers: { 'X-Diagnostic': 'request-config-secret' },
    method: 'get',
    url: SECRET_TELEMETRY_URL,
  };

  return {
    code,
    config,
    message: `Telemetry request to ${SECRET_TELEMETRY_URL} failed with secret`,
    request: { config },
    ...(status
      ? {
          response: {
            config: {
              ...config,
              headers: { 'X-Diagnostic': 'response-config-secret' },
            },
            data: {
              errors: [{ detail: `Telemetry response exposed ${SECRET_TELEMETRY_URL}` }],
            },
            headers: {},
            status,
          },
        }
      : {}),
  };
};

const makeInspectable = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return '[circular]';
  }

  seen.add(value);
  return Object.fromEntries(
    Object.getOwnPropertyNames(value).map((key) => [
      key,
      makeInspectable((value as Record<string, unknown>)[key], seen),
    ])
  );
};

const expectTelemetryErrorRedacted = (error: PubgApiError): void => {
  const surfaces = [
    JSON.stringify(makeInspectable(error)),
    JSON.stringify(error),
    JSON.stringify(error.getDetails()),
    JSON.stringify(error.context),
  ].join('\n');

  for (const marker of TELEMETRY_SECRET_MARKERS) {
    expect(surfaces).not.toContain(marker);
  }
  expect(error.context.metadata).toMatchObject({
    endpoint: 'external_telemetry',
    method: 'get',
  });
  expect(error.context.metadata).not.toHaveProperty('url');
};

describe('ClientRuntime isolation', () => {
  beforeEach(() => {
    resetAxiosMock();
  });

  it('does not share cached responses between clients', async () => {
    const firstRequest = jest.fn().mockResolvedValue({
      data: { origin: 'one' },
      status: 200,
      headers: {},
      config: { method: 'get', url: '/players' },
    });
    const secondRequest = jest.fn().mockResolvedValue({
      data: { origin: 'two' },
      status: 200,
      headers: {},
      config: { method: 'get', url: '/players' },
    });
    const first = ClientRuntime.forTest({
      request: firstRequest,
      baseUrl: 'https://one.test',
    });
    const second = ClientRuntime.forTest({
      request: secondRequest,
      baseUrl: 'https://two.test',
    });

    await expect(first.get('/players')).resolves.toEqual({ origin: 'one' });
    await expect(second.get('/players')).resolves.toEqual({ origin: 'two' });
    expect(firstRequest).toHaveBeenCalledTimes(1);
    expect(secondRequest).toHaveBeenCalledTimes(1);
  });

  it('clears only the owning response cache', async () => {
    const first = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue({
        data: 1,
        status: 200,
        headers: {},
        config: { method: 'get', url: '/x' },
      }),
    });
    const second = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue({
        data: 2,
        status: 200,
        headers: {},
        config: { method: 'get', url: '/x' },
      }),
    });
    await first.get('/x');
    await second.get('/x');
    first.clearResponseCache();
    expect(first.getHealth().responseCache.size).toBe(0);
    expect(second.getHealth().responseCache.size).toBe(1);
  });

  it('fetches telemetry without authorization or response caching', async () => {
    const externalGet = jest.fn().mockResolvedValue({ data: [{ _T: 'LogMatchStart' }] });
    const runtime = ClientRuntime.forTest({ request: jest.fn(), externalGet });
    await runtime.fetchTelemetry('https://telemetry.test/match-1');
    expect(externalGet).toHaveBeenCalledWith(
      'https://telemetry.test/match-1',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
    expect(externalGet.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    expect(runtime.getHealth()).toMatchObject({
      status: 'unknown',
      requests: { attempted: 1, succeeded: 1, failed: 0 },
      responseCache: { size: 0 },
    });
  });

  it('maps telemetry failures before recording one network failure', async () => {
    const externalGet = jest.fn().mockRejectedValue(createExternalError(undefined, 'ENOTFOUND'));
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      externalGet,
      now: () => new Date('2026-07-13T15:00:00.000Z'),
    });

    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      PubgNetworkError
    );
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
      externalGet: jest.fn().mockRejectedValue(createSecretExternalError(undefined, 'ENOTFOUND')),
    });

    const error = await runtime.fetchTelemetry(SECRET_TELEMETRY_URL).catch((caught) => caught);

    expect(error).toBeInstanceOf(PubgNetworkError);
    expectTelemetryErrorRedacted(error as PubgNetworkError);
    expect((error as PubgNetworkError).originalError).toBeUndefined();
    expect(runtime.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'network_failed',
    });
  });

  it('redacts secret-bearing telemetry HTTP failures while preserving typed health mapping', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      externalGet: jest.fn().mockRejectedValue(createSecretExternalError(401)),
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
    const externalGet = jest.fn().mockRejectedValue(createExternalError(status));
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse({ ok: true })),
      externalGet,
      now: () => new Date('2026-07-13T15:00:00.000Z'),
    });

    await runtime.get('/players', { useCache: false });
    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      ErrorType
    );
    expect(runtime.getHealth()).toMatchObject({
      status: 'healthy',
      reason: 'request_succeeded',
      requests: { attempted: 2, succeeded: 1, failed: 1 },
    });
  });

  it('records telemetry 401 as an authentication failure', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      externalGet: jest.fn().mockRejectedValue(createExternalError(401)),
    });

    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      PubgAuthenticationError
    );
    expect(runtime.getHealth()).toMatchObject({
      status: 'unhealthy',
      reason: 'authentication_failed',
      statusCode: 401,
    });
  });

  it('records telemetry 429 as a rate-limit failure', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      externalGet: jest.fn().mockRejectedValue(createExternalError(429)),
    });

    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      PubgRateLimitError
    );
    expect(runtime.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'rate_limited',
      statusCode: 429,
    });
  });

  it('records telemetry 5xx as a server failure', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn(),
      externalGet: jest.fn().mockRejectedValue(createExternalError(503)),
    });

    await expect(runtime.fetchTelemetry('https://telemetry.test/match-1')).rejects.toThrow(
      PubgNetworkError
    );
    expect(runtime.getHealth()).toMatchObject({
      status: 'degraded',
      reason: 'server_failed',
      statusCode: 503,
    });
  });

  it('does not recover upstream failure health after telemetry succeeds', async () => {
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockRejectedValue(createExternalError(401)),
      externalGet: jest.fn().mockResolvedValue(createResponse([{ _T: 'LogMatchStart' }])),
    });

    await expect(runtime.get('/players', { useCache: false })).rejects.toThrow(
      PubgAuthenticationError
    );
    await runtime.fetchTelemetry('https://telemetry.test/match-1');
    expect(runtime.getHealth()).toMatchObject({
      status: 'unhealthy',
      reason: 'authentication_failed',
      requests: { attempted: 2, succeeded: 1, failed: 1 },
    });
  });
});

describe('ClientRuntime construction', () => {
  const config = {
    apiKey: 'test-api-key',
    retryAttempts: 2,
    retryDelay: 0,
    shard: 'pc-na' as const,
    timeout: 5000,
  };

  beforeEach(() => {
    resetAxiosMock();
  });

  it('creates the authenticated Axios adapter with the default PUBG API URL', () => {
    new ClientRuntime(config);

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

  it('uses a custom PUBG API base URL', () => {
    new ClientRuntime({ ...config, baseUrl: 'https://custom.api.test' });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://custom.api.test' })
    );
  });

  it('validates required configuration', () => {
    expect(() => new ClientRuntime({ ...config, apiKey: '' })).toThrow(PubgConfigurationError);
    expect(() => new ClientRuntime({ ...config, shard: '' as typeof config.shard })).toThrow(
      PubgConfigurationError
    );
  });

  it('performs authenticated requests through the production Axios adapter', async () => {
    const request = jest.fn().mockResolvedValue(createResponse({ test: 'data' }));
    mockedAxios.create.mockReturnValue({ request } as unknown as AxiosInstance);
    const runtime = new ClientRuntime(config);

    await expect(runtime.get('/test', { useCache: false })).resolves.toEqual({ test: 'data' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'get', url: '/test', useCache: false })
    );
  });

  it('uses the no-auth external Axios adapter for telemetry', async () => {
    const authenticatedRequest = jest.fn();
    const telemetryRequest = jest.fn().mockResolvedValue(createResponse([{ _T: 'LogMatchStart' }]));
    mockedAxios.create
      .mockReturnValueOnce({ request: authenticatedRequest } as unknown as AxiosInstance)
      .mockReturnValueOnce({ request: telemetryRequest } as unknown as AxiosInstance);
    const runtime = new ClientRuntime(config);

    await runtime.fetchTelemetry('https://telemetry.test/match-1');

    expect(authenticatedRequest).not.toHaveBeenCalled();
    expect(telemetryRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        method: 'get',
        url: 'https://telemetry.test/match-1',
      })
    );
    expect(telemetryRequest.mock.calls[0][0].headers).not.toHaveProperty('Authorization');
  });
});
