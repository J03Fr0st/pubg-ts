import type { RateLimitHealthSnapshot } from '../client-health';

/** Sliding-window rate limiter: at most `maxRequests` starts per `windowMs`. */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** Resolves once a request may start, waiting for the window to free a slot if needed. */
  async waitForSlot(): Promise<void> {
    const now = Date.now();

    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }
    }

    this.requests.push(now);
  }

  /** Prunes expired starts once and describes the entire active window at one instant. */
  snapshot(): RateLimitHealthSnapshot {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return {
      remaining: Math.max(0, this.maxRequests - this.requests.length),
      limit: this.maxRequests,
      resetAt:
        this.requests.length === 0
          ? null
          : new Date(Math.min(...this.requests) + this.windowMs).toISOString(),
    };
  }
}
