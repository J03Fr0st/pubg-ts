jest.unmock('axios');

import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import axios, { type AxiosAdapter, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { ClientRuntime } from '../../src/api/client-runtime';

describe('ClientRuntime production telemetry adapter', () => {
  it('allows only telemetry response headers through the final adapter request', async () => {
    const credentialHeaders = ['Authorization', 'Cookie', 'Proxy-Authorization', 'X-API-Key'];
    const originalHeaders = Object.fromEntries(
      credentialHeaders.map((name) => [name, axios.defaults.headers.common[name]])
    );
    const originalAdapter = axios.defaults.adapter;
    const finalAdapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
      config,
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
    let receivedAuthorization: string | undefined;
    const server = createServer((request, response) => {
      receivedAuthorization = request.headers.authorization;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('[]');
    });

    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
      });
      const { port } = server.address() as AddressInfo;
      axios.defaults.auth = { username: 'global-user', password: 'global-password' };
      const runtime = new ClientRuntime({ apiKey: 'pubg-key', shard: 'steam' });

      await runtime.fetchTelemetry(`http://127.0.0.1:${port}/telemetry`);

      expect(receivedAuthorization).toBeUndefined();
    } finally {
      if (originalAuth === undefined) {
        delete axios.defaults.auth;
      } else {
        axios.defaults.auth = originalAuth;
      }
      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
    }
  });
});
