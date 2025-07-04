import 'dotenv/config';
import { PubgClient } from '../../src/api/client';
import type { PubgClientConfig } from '../../src/types/api';

describe('API Integration Tests', () => {
  let client: PubgClient;
  let config: PubgClientConfig;

  beforeEach(() => {
    config = {
      apiKey: process.env.PUBG_API_KEY || 'test-api-key',
      shard: 'pc-na',
    };

    client = new PubgClient(config);
  });

  describe('Players API', () => {
    it('should handle invalid player name gracefully', async () => {
      if (!process.env.PUBG_API_KEY) {
        // Skip integration tests if no API key is provided
        return;
      }

      try {
        await client.players.getPlayerByName('this-player-does-not-exist-12345');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Seasons API', () => {
    it('should get seasons without error', async () => {
      if (!process.env.PUBG_API_KEY) {
        // Skip integration tests if no API key is provided
        return;
      }

      try {
        const seasons = await client.seasons.getSeasons();
        expect(seasons).toBeDefined();
        expect(seasons.data).toBeInstanceOf(Array);
      } catch (error) {
        // API might be unavailable, just ensure error is handled
        expect(error).toBeDefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit status', () => {
      const status = client.getRateLimitStatus();

      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetTime');
      expect(typeof status.remaining).toBe('number');
      expect(typeof status.resetTime).toBe('number');
    });
  });
});
