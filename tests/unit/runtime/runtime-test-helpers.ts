import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { endpointTarget } from '../../../src/api/endpoint-query';
import type { PubgApiError } from '../../../src/errors';

export const runtimeConfig = {
  apiKey: 'test-api-key',
  retryAttempts: 2,
  retryDelay: 0,
  shard: 'pc-na' as const,
  timeout: 5000,
};

export const PLAYERS_TARGET = endpointTarget('steam', ['players']);

export const createResponse = <T>(data: T, url = '/shards/steam/players'): any => ({
  config: { method: 'get', url },
  data,
  headers: {},
  status: 200,
  statusText: '200',
});

export const createError = (status?: number, code?: string) => ({
  code,
  config: { method: 'get', url: PLAYERS_TARGET },
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

export const SECRET_TELEMETRY_URL = 'https://telemetry.test/match?token=secret';
const TELEMETRY_SECRET_MARKERS = [
  SECRET_TELEMETRY_URL,
  'telemetry.test',
  'token',
  'secret',
  'request-config-secret',
  'response-config-secret',
];

export const createSecretTelemetryError = (status?: number, code?: string) => {
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

export const expectTelemetryErrorRedacted = (error: PubgApiError): void => {
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

export const withLocalServer = async (
  run: (
    baseUrl: string,
    seen: { authorization?: string; path?: string; query?: string }
  ) => Promise<void>
): Promise<void> => {
  const seen: { authorization?: string; path?: string; query?: string } = {};
  const server = createServer((request, response) => {
    seen.authorization = request.headers.authorization;
    const [path, query] = (request.url ?? '').split('?');
    seen.path = path;
    seen.query = query;
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ served: true }));
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`, seen);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
};

export const createAuthenticatedNetworkError = () =>
  Object.assign(new Error('lookup failed'), {
    code: 'ENOTFOUND',
    config: {
      headers: { Authorization: 'Bearer test-api-key' },
      method: 'get',
      url: PLAYERS_TARGET,
    },
  });
