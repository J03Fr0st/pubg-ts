jest.unmock('axios');

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
});
