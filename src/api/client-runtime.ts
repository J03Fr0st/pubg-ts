import axios, {
  type AxiosAdapter,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { PubgConfigurationError } from '../errors';
import type { PubgClientConfig } from '../types/api';
import { SHARDS } from '../types/shards';
import { MemoryCache } from '../utils/cache';
import { logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { RequestDeduplicator } from '../utils/request';
import { type ClientHealth, ClientHealthState, type RequestOutcome } from './client-health';
import type { CacheRequestConfig, MatchTransport } from './endpoint-transport';
import { HttpTransactionRunner } from './http-transaction';

type RuntimeRequestFunction = (config: AxiosRequestConfig) => Promise<AxiosResponse>;
type RuntimeExternalGetFunction = <T>(
  url: string,
  config?: AxiosRequestConfig
) => Promise<AxiosResponse<T>>;

interface ClientRuntimeAdapters {
  request?: RuntimeRequestFunction;
  externalGet?: RuntimeExternalGetFunction;
  now?: () => Date;
}

interface TransactionRuntimeDependencies {
  cache: MemoryCache;
  rateLimiter: RateLimiter;
  deduplicator: RequestDeduplicator;
  recordOutcome: (outcome: RequestOutcome) => void;
}

const VALID_SHARDS = new Set<string>(SHARDS);

const createTelemetryAdapter = (): AxiosAdapter => {
  const adapter = axios.getAdapter(axios.defaults.adapter);

  return (config) => {
    const headers = new AxiosHeaders({ Accept: 'application/json' });
    const telemetryConfig = { ...config, headers };
    delete telemetryConfig.auth;
    return adapter(telemetryConfig);
  };
};

const createProductionTelemetryGet = (): RuntimeExternalGetFunction => {
  let telemetryClient: AxiosInstance | undefined;

  return <T>(url: string, config?: AxiosRequestConfig) => {
    telemetryClient ??= axios.create({ adapter: createTelemetryAdapter() });
    return telemetryClient.request<T>({ ...config, method: 'get', url });
  };
};

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

const createTransactionRunner = (
  config: PubgClientConfig,
  dependencies: TransactionRuntimeDependencies,
  adapters: ClientRuntimeAdapters
): HttpTransactionRunner => {
  const axiosInstance = adapters.request
    ? undefined
    : axios.create({
        baseURL: config.baseUrl || 'https://api.pubg.com',
        timeout: config.timeout ?? 10000,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
      });

  return new HttpTransactionRunner({
    ...dependencies,
    config,
    externalGet: adapters.externalGet ?? createProductionTelemetryGet(),
    request: adapters.request ?? ((requestConfig) => axiosInstance!.request(requestConfig)),
  });
};

/**
 * Client-local composition root for request state and transaction execution.
 *
 * @internal
 */
export class ClientRuntime implements MatchTransport {
  private readonly cache: MemoryCache;
  private readonly rateLimiter: RateLimiter;
  private readonly health: ClientHealthState;
  private readonly transactions: HttpTransactionRunner;

  constructor(config: PubgClientConfig, adapters: ClientRuntimeAdapters = {}) {
    validateConfig(config);
    this.cache = new MemoryCache({ ttl: 300_000, maxSize: 1000 });
    this.rateLimiter = new RateLimiter(10, 60_000);
    this.health = new ClientHealthState(adapters.now);
    this.transactions = createTransactionRunner(
      config,
      {
        cache: this.cache,
        rateLimiter: this.rateLimiter,
        deduplicator: new RequestDeduplicator(),
        recordOutcome: (outcome) => this.health.record(outcome),
      },
      adapters
    );

    logger.client('Client runtime initialized', { shard: config.shard, timeout: config.timeout });
  }

  /**
   * Creates a deterministic internal runtime around test-owned network adapters.
   *
   * @internal
   */
  static forTest(options: {
    request: RuntimeRequestFunction;
    externalGet?: RuntimeExternalGetFunction;
    baseUrl?: string;
    now?: () => Date;
  }): ClientRuntime {
    return new ClientRuntime(
      { apiKey: 'test-key', shard: 'steam', baseUrl: options.baseUrl },
      {
        request: options.request,
        externalGet: options.externalGet,
        now: options.now,
      }
    );
  }

  /** Performs an authenticated PUBG API GET through this client's runtime. */
  get<T>(url: string, config?: CacheRequestConfig): Promise<T> {
    return this.transactions.get<T>(url, config);
  }

  /** Fetches external telemetry without authenticated headers or response caching. */
  fetchTelemetry<T>(url: string): Promise<T> {
    return this.transactions.getExternal<T>(url, {
      headers: { Accept: 'application/json' },
    });
  }

  /** Returns a synchronous, redacted health snapshot for this client runtime. */
  getHealth(): ClientHealth {
    const { size, maxSize, hits, misses, hitRate } = this.cache.getStats();
    const remaining = this.rateLimiter.getRemainingRequests();
    const resetTime = this.rateLimiter.getResetTime();
    return this.health.snapshot(
      { size, maxSize, hits, misses, hitRate },
      {
        remaining,
        limit: this.rateLimiter.getLimit(),
        resetAt: resetTime === 0 ? null : new Date(resetTime).toISOString(),
      }
    );
  }

  /** Clears only this client's response cache. */
  clearResponseCache(): void {
    this.cache.clear();
  }
}
