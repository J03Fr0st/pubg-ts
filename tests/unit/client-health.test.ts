import { ClientHealthState } from '../../src/api/client-health';

const cache = {
  size: 2,
  maxSize: 1000,
  hits: 3,
  misses: 1,
  hitRate: 0.75,
};

const rateLimit = { remaining: 7, limit: 10, resetAt: '2026-07-13T16:00:00.000Z' };

describe('ClientHealthState', () => {
  const now = jest.fn(() => new Date('2026-07-13T15:00:00.000Z'));

  beforeEach(() => now.mockClear());

  it('starts unknown and redacted', () => {
    const state = new ClientHealthState(now);
    expect(state.snapshot(cache, rateLimit)).toEqual({
      status: 'unknown',
      reason: 'not_observed',
      transitionedAt: null,
      requests: { attempted: 0, succeeded: 0, failed: 0 },
      responseCache: cache,
      rateLimit,
    });
  });

  it.each([
    [{ kind: 'authentication_failed', statusCode: 401 }, 'unhealthy', 'authentication_failed'],
    [{ kind: 'rate_limited', statusCode: 429 }, 'degraded', 'rate_limited'],
    [{ kind: 'network_failed' }, 'degraded', 'network_failed'],
    [{ kind: 'server_failed', statusCode: 503 }, 'degraded', 'server_failed'],
  ] as const)('maps %o to %s', (outcome, status, reason) => {
    const state = new ClientHealthState(now);
    state.record(outcome);
    expect(state.snapshot(cache, rateLimit)).toMatchObject({
      status,
      reason,
      transitionedAt: '2026-07-13T15:00:00.000Z',
    });
  });

  it('recovers only after a real authenticated success', () => {
    const state = new ClientHealthState(now);
    state.record({ kind: 'authentication_failed', statusCode: 401 });
    state.record({ kind: 'cache_hit' });
    expect(state.snapshot(cache, rateLimit).status).toBe('unhealthy');
    state.record({ kind: 'request_succeeded' });
    expect(state.snapshot(cache, rateLimit).status).toBe('healthy');
  });

  it('counts ignored failures without changing status', () => {
    const state = new ClientHealthState(now);
    state.record({ kind: 'request_succeeded' });
    state.record({ kind: 'request_rejected', statusCode: 404 });
    expect(state.snapshot(cache, rateLimit)).toMatchObject({
      status: 'healthy',
      requests: { attempted: 2, succeeded: 1, failed: 1 },
    });
  });
});
