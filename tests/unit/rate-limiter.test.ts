import { RateLimiter } from '../../src/utils/rate-limiter';

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

  describe('getRemainingRequests', () => {
    it('should return correct remaining requests', async () => {
      expect(rateLimiter.getRemainingRequests()).toBe(3);

      await rateLimiter.waitForSlot();
      expect(rateLimiter.getRemainingRequests()).toBe(2);

      await rateLimiter.waitForSlot();
      expect(rateLimiter.getRemainingRequests()).toBe(1);

      await rateLimiter.waitForSlot();
      expect(rateLimiter.getRemainingRequests()).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 when no requests made', () => {
      expect(rateLimiter.getResetTime()).toBe(0);
    });

    it('should return correct reset time after requests', async () => {
      const start = Date.now();
      await rateLimiter.waitForSlot();

      const resetTime = rateLimiter.getResetTime();
      expect(resetTime).toBeGreaterThan(start);
      expect(resetTime).toBeLessThanOrEqual(start + 1000);
    });
  });
});
