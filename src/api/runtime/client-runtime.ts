import axios, {
  type AxiosAdapter,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { PubgConfigurationError } from '../../errors';
import type { PubgClientConfig } from '../../types/api';
import { SHARDS } from '../../types/shards';
import { type ClientHealth, ClientHealthState } from '../client-health';
import type { EndpointTarget } from '../endpoint-query';
import type { MatchTransport } from '../endpoint-transport';
import { createCacheKey, MemoryCache } from './cache';
import { logger, withTiming } from './logger';
import { RateLimiter } from './rate-limiter';
import { RequestDeduplicator } from './request-deduplicator';
import {
  interpretFailure,
  isRetryable,
  mapRequestError,
  mapTelemetryError,
  requestConfigOf,
} from './request-failure';

/** Sends one authenticated PUBG request. Production uses an Axios instance; tests supply a fake. */
export type RequestFunction = (config: AxiosRequestConfig) => Promise<AxiosResponse>;

/** Sends one unauthenticated Match Telemetry request to an external URL. */
export type TelemetryRequestFunction = <T>(
  url: string,
  config?: AxiosRequestConfig
) => Promise<AxiosResponse<T>>;

/** Network adapters and clock a runtime may be built around; production defaults fill any gap. */
export interface ClientRuntimeAdapters {
  request?: RequestFunction;
  fetchTelemetry?: TelemetryRequestFunction;
  now?: () => Date;
}

/** Request policy with every optional `PubgClientConfig` default resolved once at construction. */
interface RequestPolicy {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

const DEFAULT_BASE_URL = 'https://api.pubg.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_ATTEMPTS = 0;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const RESPONSE_CACHE_TTL_MS = 5 * 60 * 1000;
const RESPONSE_CACHE_MAX_SIZE = 1_000;
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const TELEMETRY_ACCEPT = 'application/json';
const VALID_SHARDS = new Set<string>(SHARDS);

const validateConfig = (config: PubgClientConfig): void => {
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new PubgConfigurationError(
      'API key is required and must be a valid string',
      'apiKey',
      'string',
      config.apiKey
    );
  }

  if (!config.shard || typeof config.shard !== 'string' || !VALID_SHARDS.has(config.shard)) {
    throw new PubgConfigurationError(
      'Shard is required and must be a supported PUBG shard',
      'shard',
      'Shard',
      config.shard
    );
  }

  if (
    config.timeout !== undefined &&
    (typeof config.timeout !== 'number' || !Number.isFinite(config.timeout) || config.timeout <= 0)
  ) {
    throw new PubgConfigurationError(
      'Timeout must be a positive finite number',
      'timeout',
      'positive finite number',
      config.timeout
    );
  }

  if (
    config.retryAttempts !== undefined &&
    (typeof config.retryAttempts !== 'number' ||
      !Number.isFinite(config.retryAttempts) ||
      config.retryAttempts < 0)
  ) {
    throw new PubgConfigurationError(
      'Retry attempts must be a non-negative finite number',
      'retryAttempts',
      'non-negative finite number',
      config.retryAttempts
    );
  }

  if (
    config.retryDelay !== undefined &&
    (typeof config.retryDelay !== 'number' ||
      !Number.isFinite(config.retryDelay) ||
      config.retryDelay < 0)
  ) {
    throw new PubgConfigurationError(
      'Retry delay must be a non-negative finite number',
      'retryDelay',
      'non-negative finite number',
      config.retryDelay
    );
  }
};

const resolvePolicy = (config: PubgClientConfig): RequestPolicy => ({
  baseUrl: config.baseUrl || DEFAULT_BASE_URL,
  timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
  retryAttempts: config.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
  retryDelay: config.retryDelay ?? DEFAULT_RETRY_DELAY_MS,
});

const createAuthenticatedRequest = (apiKey: string, policy: RequestPolicy): RequestFunction => {
  const instance = axios.create({
    baseURL: policy.baseUrl,
    timeout: policy.timeout,
    transitional: { clarifyTimeoutError: true },
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/json',
    },
  });

  return (requestConfig) => instance.request(requestConfig);
};

// Telemetry hosts are external, so the adapter replaces every header and drops Basic auth: nothing
// from the authenticated client or from Axios global defaults may reach them.
const createTelemetryAdapter = (): AxiosAdapter => {
  const adapter = axios.getAdapter(axios.defaults.adapter);

  return (config) => {
    const telemetryConfig = { ...config, headers: new AxiosHeaders({ Accept: TELEMETRY_ACCEPT }) };
    delete telemetryConfig.auth;
    return adapter(telemetryConfig);
  };
};

const createTelemetryRequest = (): TelemetryRequestFunction => {
  let telemetryClient: AxiosInstance | undefined;

  return <T>(url: string, config?: AxiosRequestConfig) => {
    telemetryClient ??= axios.create({
      adapter: createTelemetryAdapter(),
      transitional: { clarifyTimeoutError: true },
    });
    return telemetryClient.request<T>({ ...config, method: 'get', url });
  };
};

/**
 * The request runtime owned by one `PubgClient`: its response cache, rate limiter, request
 * deduplication, retry policy, and Client Health. No request state lives outside an instance.
 *
 * @internal
 */
export class ClientRuntime implements MatchTransport {
  private readonly policy: RequestPolicy;
  private readonly cache: MemoryCache;
  private readonly rateLimiter: RateLimiter;
  private readonly deduplicator = new RequestDeduplicator();
  private readonly health: ClientHealthState;
  private readonly request: RequestFunction;
  private readonly requestTelemetry: TelemetryRequestFunction;

  constructor(config: PubgClientConfig, adapters: ClientRuntimeAdapters = {}) {
    validateConfig(config);
    this.policy = resolvePolicy(config);
    this.cache = new MemoryCache({ ttl: RESPONSE_CACHE_TTL_MS, maxSize: RESPONSE_CACHE_MAX_SIZE });
    this.rateLimiter = new RateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS);
    this.health = new ClientHealthState(adapters.now);
    this.request = adapters.request ?? createAuthenticatedRequest(config.apiKey, this.policy);
    this.requestTelemetry = adapters.fetchTelemetry ?? createTelemetryRequest();

    logger.client('Client runtime initialized', {
      shard: config.shard,
      timeout: this.policy.timeout,
    });
  }

  /**
   * Creates a deterministic runtime around test-owned network adapters.
   *
   * @internal
   */
  static forTest(
    options: ClientRuntimeAdapters &
      Pick<PubgClientConfig, 'baseUrl' | 'timeout' | 'retryAttempts' | 'retryDelay'> & {
        request: RequestFunction;
      }
  ): ClientRuntime {
    const { request, fetchTelemetry, now, ...config } = options;
    return new ClientRuntime(
      { apiKey: 'test-key', shard: 'steam', ...config },
      { request, fetchTelemetry, now }
    );
  }

  /** Performs an authenticated PUBG GET, serving repeats from this client's response cache. */
  async get<T>(target: EndpointTarget): Promise<T> {
    const cacheKey = createCacheKey('http', 'GET', target);
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== undefined) {
      this.health.record({ kind: 'cache_hit' });
      return cached;
    }

    return this.deduplicator.deduplicate(cacheKey, async () => {
      const response = await withTiming(logger.http, `GET ${target}`, () =>
        this.execute<T>({ method: 'get', url: target })
      );

      if (response.status === 200) {
        this.cache.set(cacheKey, response.data);
      }

      return response.data;
    });
  }

  /** Fetches Match Telemetry from its external URL without PUBG credentials or response caching. */
  async fetchTelemetry<T>(url: string): Promise<T> {
    try {
      const response = await this.requestTelemetry<T>(url, {
        method: 'get',
        timeout: this.policy.timeout,
        url,
      });
      this.health.record({ kind: 'telemetry_succeeded' });
      return response.data;
    } catch (error) {
      const failure = interpretFailure(error);
      this.health.record(failure.outcome);
      throw mapTelemetryError(failure);
    }
  }

  /** Returns a synchronous, redacted health snapshot for this client runtime. */
  getHealth(): ClientHealth {
    const { size, maxSize, hits, misses, hitRate } = this.cache.getStats();
    return this.health.snapshot(
      { size, maxSize, hits, misses, hitRate },
      this.rateLimiter.snapshot()
    );
  }

  /** Clears only this client's response cache. */
  clearResponseCache(): void {
    this.cache.clear();
  }

  // One logical request: every attempt takes a rate-limit slot, but only the terminal result is
  // recorded as an outcome, so retries never inflate request counts or flap Client Health.
  private async execute<T>(
    requestConfig: AxiosRequestConfig,
    attempt = 1
  ): Promise<AxiosResponse<T>> {
    await this.rateLimiter.waitForSlot();

    try {
      const response = (await this.request(requestConfig)) as AxiosResponse<T>;
      this.health.record({ kind: 'request_succeeded' });
      return response;
    } catch (error) {
      const failure = interpretFailure(error);

      if (isRetryable(failure) && attempt <= this.policy.retryAttempts) {
        await this.waitForRetry(attempt);
        return this.execute<T>(requestConfigOf(error, requestConfig), attempt + 1);
      }

      this.health.record(failure.outcome);
      throw mapRequestError(error, requestConfig, failure, this.policy.timeout);
    }
  }

  private async waitForRetry(attempt: number): Promise<void> {
    const delay = this.policy.retryDelay * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
