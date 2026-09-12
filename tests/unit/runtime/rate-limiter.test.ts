import { RateLimiter } from '../../../src/api/runtime/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 requests per second for testing
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('waitForSlot', () => {
    it('should allow requests within the limit', async () => {
      const start = Date.now();

      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();

      const end = Date.now();
      expect(end - start).toBeLessThan(100); // Should be immediate
    });

    it('should delay requests when limit is exceeded', async () => {
      jest.useFakeTimers();

      // Fill up the rate limit
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();

      // This should be delayed
      const promise = rateLimiter.waitForSlot();

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      await promise;

      jest.useRealTimers();
    });
  });

  describe('snapshot remaining', () => {
    it('should return correct remaining requests', async () => {
      expect(rateLimiter.snapshot().remaining).toBe(3);

      await rateLimiter.waitForSlot();
      expect(rateLimiter.snapshot().remaining).toBe(2);

      await rateLimiter.waitForSlot();
      expect(rateLimiter.snapshot().remaining).toBe(1);

      await rateLimiter.waitForSlot();
      expect(rateLimiter.snapshot().remaining).toBe(0);
    });
  });

  describe('snapshot reset time', () => {
    it('returns null when no requests were made', () => {
      expect(rateLimiter.snapshot().resetAt).toBeNull();
    });

    it('should return correct reset time after requests', async () => {
      const start = Date.now();
      await rateLimiter.waitForSlot();

      const resetTime = Date.parse(rateLimiter.snapshot().resetAt!);
      expect(resetTime).toBeGreaterThan(start);
      expect(resetTime).toBeLessThanOrEqual(start + 1000);
    });
  });
});
