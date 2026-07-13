import { PubgClient } from '../../src/api/client';
import { Leaderboards } from '../../src/api/services/leaderboards';
import { Matches } from '../../src/api/services/matches';
import { Players } from '../../src/api/services/players';
import { Samples } from '../../src/api/services/samples';
import { Seasons } from '../../src/api/services/seasons';
import type { PubgClientConfig } from '../../src/types/api';

describe('PubgClient', () => {
  const config: PubgClientConfig = {
    apiKey: 'test-api-key',
    shard: 'pc-na',
  };

  it('initializes all endpoint services and assets', () => {
    const client = new PubgClient(config);

    expect(client.players).toBeInstanceOf(Players);
    expect(client.matches).toBeInstanceOf(Matches);
    expect(client.seasons).toBeInstanceOf(Seasons);
    expect(client.leaderboards).toBeInstanceOf(Leaderboards);
    expect(client.samples).toBeInstanceOf(Samples);
    expect(client.assets).toBeDefined();
  });

  it('exposes a synchronous redacted health snapshot', () => {
    const client = new PubgClient(config);

    expect(client.getHealth()).toEqual({
      status: 'unknown',
      reason: 'not_observed',
      transitionedAt: null,
      requests: { attempted: 0, succeeded: 0, failed: 0 },
      responseCache: { size: 0, maxSize: 1000, hits: 0, misses: 0, hitRate: 0 },
      rateLimit: { remaining: 10, limit: 10, resetAt: null },
    });
  });

  it('clears its response cache without exposing runtime internals', () => {
    const client = new PubgClient(config);

    expect(() => client.clearResponseCache()).not.toThrow();
    expect(client.getHealth().responseCache.size).toBe(0);
  });
});
