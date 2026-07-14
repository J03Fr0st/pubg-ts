/** Overall last-observed operability of a client runtime. */
export type ClientHealthStatus = 'unknown' | 'healthy' | 'degraded' | 'unhealthy';

/** Stable, redacted reason for the most recent health transition. */
export type ClientHealthReason =
  | 'not_observed'
  | 'request_succeeded'
  | 'authentication_failed'
  | 'rate_limited'
  | 'network_failed'
  | 'server_failed';

/** Terminal outcome of one logical request after retries and cache handling. */
export type RequestOutcome =
  | { kind: 'request_succeeded' }
  | { kind: 'authentication_failed'; statusCode: 401 }
  | { kind: 'rate_limited'; statusCode: 429 }
  | { kind: 'network_failed' }
  | { kind: 'server_failed'; statusCode: number }
  | { kind: 'request_rejected'; statusCode: 400 | 404 }
  | { kind: 'cache_hit' }
  | { kind: 'telemetry_succeeded' };

/** Redacted response-cache statistics included with a health snapshot. */
export interface CacheHealthSnapshot {
  readonly size: number;
  readonly maxSize: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number;
}

/** Redacted last-known rate-limit state included with a health snapshot. */
export interface RateLimitHealthSnapshot {
  readonly remaining: number;
  readonly limit: number;
  readonly resetAt: string | null;
}

/** Synchronous, redacted view of client request health and runtime statistics. */
export interface ClientHealth {
  readonly status: ClientHealthStatus;
  readonly reason: ClientHealthReason;
  readonly transitionedAt: string | null;
  readonly statusCode?: number;
  readonly requests: Readonly<{ attempted: number; succeeded: number; failed: number }>;
  readonly responseCache: CacheHealthSnapshot;
  readonly rateLimit: RateLimitHealthSnapshot;
}

/** Reduces terminal request outcomes into client-local health state. */
export class ClientHealthState {
  private status: ClientHealthStatus = 'unknown';
  private reason: ClientHealthReason = 'not_observed';
  private transitionedAt: string | null = null;
  private statusCode?: number;
  private requests = { attempted: 0, succeeded: 0, failed: 0 };

  constructor(private readonly now: () => Date = () => new Date()) {}

  /** Records one terminal logical request outcome and applies any health transition. */
  record(outcome: RequestOutcome): void {
    this.requests.attempted++;
    if (
      outcome.kind === 'request_succeeded' ||
      outcome.kind === 'cache_hit' ||
      outcome.kind === 'telemetry_succeeded'
    ) {
      this.requests.succeeded++;
    } else {
      this.requests.failed++;
    }

    const transition = this.transitionFor(outcome);
    if (!transition) return;
    this.status = transition.status;
    this.reason = transition.reason;
    this.statusCode = transition.statusCode;
    this.transitionedAt = this.now().toISOString();
  }

  /** Returns a synchronous, redacted copy of current health with the supplied runtime statistics. */
  snapshot(responseCache: CacheHealthSnapshot, rateLimit: RateLimitHealthSnapshot): ClientHealth {
    return {
      status: this.status,
      reason: this.reason,
      transitionedAt: this.transitionedAt,
      ...(this.statusCode === undefined ? {} : { statusCode: this.statusCode }),
      requests: { ...this.requests },
      responseCache: { ...responseCache },
      rateLimit: { ...rateLimit },
    };
  }

  private transitionFor(
    outcome: RequestOutcome
  ): { status: ClientHealthStatus; reason: ClientHealthReason; statusCode?: number } | undefined {
    switch (outcome.kind) {
      case 'request_succeeded':
        return { status: 'healthy', reason: 'request_succeeded' };
      case 'authentication_failed':
        return { status: 'unhealthy', reason: 'authentication_failed', statusCode: 401 };
      case 'rate_limited':
        return { status: 'degraded', reason: 'rate_limited', statusCode: 429 };
      case 'network_failed':
        return { status: 'degraded', reason: 'network_failed' };
      case 'server_failed':
        return { status: 'degraded', reason: 'server_failed', statusCode: outcome.statusCode };
      default:
        return undefined;
    }
  }
}
