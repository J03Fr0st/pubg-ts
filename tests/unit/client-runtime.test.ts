import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { ClientRuntime } from '../../src/api/client-runtime';
import { PubgConfigurationError, PubgNetworkError } from '../../src/errors';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get = jest.fn();

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

describe('ClientRuntime isolation', () => {
  beforeEach(() => {
    mockedAxios.create.mockReset();
    mockedAxios.get.mockReset();
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
    const externalGet = jest.fn().mockRejectedValue({
      code: 'ENOTFOUND',
      config: { method: 'get', url: 'https://telemetry.test/match-1' },
      message: 'lookup failed',
    });
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
    mockedAxios.create.mockReset();
    mockedAxios.get.mockReset();
    mockedAxios.create.mockReturnValue({ request: jest.fn() } as unknown as AxiosInstance);
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

    expect(mockedAxios.create).toHaveBeenLastCalledWith(
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
    mockedAxios.get.mockResolvedValue(createResponse([{ _T: 'LogMatchStart' }]));
    const runtime = new ClientRuntime(config);

    await runtime.fetchTelemetry('https://telemetry.test/match-1');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://telemetry.test/match-1',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        method: 'get',
        url: 'https://telemetry.test/match-1',
      })
    );
    expect(mockedAxios.get.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');
  });
});
