import { logger } from './logger';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  /** Time to live in milliseconds for entries set without an explicit TTL. */
  ttl?: number;
  /** Maximum number of entries before the oldest is evicted. */
  maxSize?: number;
}

/** In-memory response cache with per-entry TTL, FIFO eviction, and hit/miss statistics. */
export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTtl: number;
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl ?? 5 * 60 * 1000;
    this.maxSize = options.maxSize ?? 1000;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiration = ttl ?? this.defaultTtl;

    if (this.cache.size >= this.maxSize) {
      this.cleanup();

      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
          logger.cache(`Evicted oldest entry: ${oldestKey}`);
        }
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: expiration,
    };

    this.cache.set(key, entry);
    logger.cache(`Set cache entry: ${key} (TTL: ${expiration}ms)`);
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.cache(`Cache miss: ${key}`);
      this.misses++;
      return undefined;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      logger.cache(`Cache expired: ${key}`);
      this.misses++;
      return undefined;
    }

    logger.cache(`Cache hit: ${key}`);
    this.hits++;
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.cache(`Cache entry deleted: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.cache(`Cache cleared: ${size} entries removed`);
  }

  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.cache(`Cache cleanup: ${removedCount} expired entries removed`);
    }
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTtl: this.defaultTtl,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

export const createCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `${prefix}:${parts.join(':')}`;
};
