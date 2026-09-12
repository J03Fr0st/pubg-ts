jest.unmock('axios');

import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ClientRuntime } from '../../../src/api/runtime/client-runtime';
import { createResponse, PLAYERS_TARGET } from './runtime-test-helpers';

describe('Request Runtime contracts', () => {
  afterEach(() => jest.useRealTimers());

  it.each(['pubg', 'telemetry'])('classifies production %s timeouts', async (kind) => {
    const server = createServer(() => {
      /* Leave the response pending until the client times out. */
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const runtime = new ClientRuntime({
        apiKey: 'test-key',
        shard: 'steam',
        baseUrl,
        timeout: 50,
      });
      const request =
        kind === 'pubg'
          ? runtime.get(PLAYERS_TARGET)
          : runtime.fetchTelemetry(`${baseUrl}/telemetry`);
      await expect(request).rejects.toMatchObject({
        networkOperation: 'timeout',
        context: {
          metadata: kind === 'pubg' ? { timeout: 50 } : { endpoint: 'external_telemetry' },
        },
      });
      expect(runtime.getHealth().requests).toEqual({ attempted: 1, succeeded: 0, failed: 1 });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('keeps refused connections distinct from timeouts', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const runtime = new ClientRuntime({
      apiKey: 'test-key',
      shard: 'steam',
      baseUrl,
      timeout: 1000,
    });
    await expect(runtime.get(PLAYERS_TARGET)).rejects.toMatchObject({
      networkOperation: 'connect',
    });
  });

  it.each([60_000, 60_001])('returns a coherent snapshot at expiry + %i ms', async (elapsed) => {
    jest.useFakeTimers().setSystemTime(100_000);
    const runtime = ClientRuntime.forTest({
      request: jest.fn().mockResolvedValue(createResponse({ ok: true })),
    });
    await runtime.get(PLAYERS_TARGET);
    jest.setSystemTime(159_999);
    expect(runtime.getHealth().rateLimit).toEqual({
      remaining: 9,
      limit: 10,
      resetAt: new Date(160_000).toISOString(),
    });
    jest.setSystemTime(100_000 + elapsed);
    const expected = { remaining: 10, limit: 10, resetAt: null };
    expect(runtime.getHealth().rateLimit).toEqual(expected);
    expect(runtime.getHealth().rateLimit).toEqual(expected);
  });
});
