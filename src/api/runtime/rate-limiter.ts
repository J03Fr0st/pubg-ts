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

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /** Returns the configured request limit for the active window. */
  getLimit(): number {
    return this.maxRequests;
  }

  /** Epoch milliseconds when the oldest in-window request expires, or 0 when the window is empty. */
  getResetTime(): number {
    if (this.requests.length === 0) return 0;

    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs;
  }
}
