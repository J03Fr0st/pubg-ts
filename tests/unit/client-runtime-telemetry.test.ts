jest.unmock('axios');

import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import axios, { type AxiosAdapter, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { ClientRuntime } from '../../src/api/client-runtime';

describe('ClientRuntime production telemetry adapter', () => {
  it('removes a global Authorization default from the final adapter request', async () => {
    const originalAuthorization = axios.defaults.headers.common.Authorization;
    const originalAdapter = axios.defaults.adapter;
    const finalAdapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
      config,
      data: [{ _T: 'LogMatchStart' }],
      headers: {},
      status: 200,
      statusText: 'OK',
    }));

    try {
      axios.defaults.headers.common.Authorization = 'Bearer global-secret';
      axios.defaults.adapter = finalAdapter as AxiosAdapter;
      const runtime = new ClientRuntime({ apiKey: 'pubg-key', shard: 'steam' });

      await runtime.fetchTelemetry('https://telemetry.test/match-1');

      expect(finalAdapter).toHaveBeenCalledTimes(1);
      const finalConfig = finalAdapter.mock.calls[0][0];
      expect(AxiosHeaders.from(finalConfig.headers).has('Authorization')).toBe(false);
    } finally {
      if (originalAuthorization === undefined) {
        delete axios.defaults.headers.common.Authorization;
      } else {
        axios.defaults.headers.common.Authorization = originalAuthorization;
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
