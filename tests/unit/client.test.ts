import { PubgClient } from '../../src/api/client';
import type { PubgClientConfig } from '../../src/types/api';

jest.mock('../../src/api/http-client');

describe('PubgClient', () => {
  let client: PubgClient;
  let config: PubgClientConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      shard: 'pc-na',
    };

    client = new PubgClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize all services', () => {
      expect(client.players).toBeDefined();
      expect(client.matches).toBeDefined();
      expect(client.seasons).toBeDefined();
      expect(client.leaderboards).toBeDefined();
      expect(client.samples).toBeDefined();
      expect(client.telemetry).toBeDefined();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return rate limit status', () => {
      // Mock the HttpClient's getRateLimitStatus method
      const mockStatus = { remaining: 10, resetTime: Date.now() + 60000 };

      // Access the private httpClient through any casting
      (client as any).httpClient.getRateLimitStatus = jest.fn().mockReturnValue(mockStatus);

      const status = client.getRateLimitStatus();

      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetTime');
      expect(status.remaining).toBe(10);
    });
  });
});
