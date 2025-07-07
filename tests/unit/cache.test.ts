import { createCacheKey, MemoryCache } from '../../src/utils/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('constructor', () => {
    it('should use default options when none provided', () => {
      const defaultCache = new MemoryCache();
      const stats = defaultCache.getStats();

      expect(stats.defaultTtl).toBe(5 * 60 * 1000); // 5 minutes
      expect(stats.maxSize).toBe(1000);
    });

    it('should use custom options when provided', () => {
      const customCache = new MemoryCache({
        ttl: 10000,
        maxSize: 100,
      });

      const stats = customCache.getStats();
      expect(stats.defaultTtl).toBe(10000);
      expect(stats.maxSize).toBe(100);
    });

    it('should handle partial options', () => {
      const partialCache = new MemoryCache({ ttl: 30000 });
      const stats = partialCache.getStats();

      expect(stats.defaultTtl).toBe(30000);
      expect(stats.maxSize).toBe(1000); // Default
    });
  });

  describe('set and get operations', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { name: 'test', value: 42 };

      cache.set(key, data);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should store different data types', () => {
      cache.set('string', 'hello world');
      cache.set('number', 123);
      cache.set('boolean', true);
      cache.set('object', { a: 1, b: 2 });
      cache.set('array', [1, 2, 3]);
      cache.set('null', null);

      expect(cache.get('string')).toBe('hello world');
      expect(cache.get('number')).toBe(123);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ a: 1, b: 2 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('null')).toBeNull();
    });

    it('should overwrite existing entries', () => {
      const key = 'overwrite-test';

      cache.set(key, 'first value');
      expect(cache.get(key)).toBe('first value');

      cache.set(key, 'second value');
      expect(cache.get(key)).toBe('second value');
    });
  });

  describe('TTL (Time To Live) functionality', () => {
    beforeEach(() => {
      // Use fake timers for TTL tests
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should respect custom TTL', () => {
      const key = 'ttl-test';
      const data = 'test data';
      const customTtl = 1000; // 1 second

      cache.set(key, data, customTtl);
      expect(cache.get(key)).toBe(data);

      // Fast-forward time by half the TTL
      jest.advanceTimersByTime(500);
      expect(cache.get(key)).toBe(data); // Should still be valid

      // Fast-forward past TTL
      jest.advanceTimersByTime(600);
      expect(cache.get(key)).toBeUndefined(); // Should be expired
    });

    it('should use default TTL when not specified', () => {
      const shortTtlCache = new MemoryCache({ ttl: 1000 });
      const key = 'default-ttl-test';
      const data = 'test data';

      shortTtlCache.set(key, data); // Using default TTL
      expect(shortTtlCache.get(key)).toBe(data);

      // Fast-forward past default TTL
      jest.advanceTimersByTime(1500);
      expect(shortTtlCache.get(key)).toBeUndefined();
    });

    it('should handle different TTLs for different entries', () => {
      const key1 = 'short-ttl';
      const key2 = 'long-ttl';

      cache.set(key1, 'data1', 500); // 0.5 seconds
      cache.set(key2, 'data2', 2000); // 2 seconds

      // After 1 second, first should be expired, second should remain
      jest.advanceTimersByTime(1000);
      expect(cache.get(key1)).toBeUndefined();
      expect(cache.get(key2)).toBe('data2');

      // After another 1.5 seconds, both should be expired
      jest.advanceTimersByTime(1500);
      expect(cache.get(key2)).toBeUndefined();
    });
  });

  describe('has method', () => {
    it('should return true for existing non-expired entries', () => {
      const key = 'exists-test';
      cache.set(key, 'data');

      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent entries', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired entries', () => {
      jest.useFakeTimers();

      const key = 'expired-test';
      cache.set(key, 'data', 1000);

      expect(cache.has(key)).toBe(true);

      // Fast-forward past TTL
      jest.advanceTimersByTime(1500);
      expect(cache.has(key)).toBe(false);

      jest.useRealTimers();
    });

    it('should remove expired entries when checking', () => {
      jest.useFakeTimers();

      const key = 'cleanup-on-has';
      cache.set(key, 'data', 1000);

      const statsBefore = cache.getStats();
      expect(statsBefore.size).toBe(1);

      // Fast-forward past TTL
      jest.advanceTimersByTime(1500);
      cache.has(key); // This should clean up the expired entry

      const statsAfter = cache.getStats();
      expect(statsAfter.size).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('delete method', () => {
    it('should delete existing entries', () => {
      const key = 'delete-test';
      cache.set(key, 'data');

      expect(cache.has(key)).toBe(true);
      const deleted = cache.delete(key);

      expect(deleted).toBe(true);
      expect(cache.has(key)).toBe(false);
      expect(cache.get(key)).toBeUndefined();
    });

    it('should return false when deleting non-existent entries', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear method', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');
      cache.set('key3', 'data3');

      expect(cache.getStats().size).toBe(3);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should work on empty cache', () => {
      expect(cache.getStats().size).toBe(0);
      cache.clear();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('cleanup method', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should remove expired entries', () => {
      // Add entries with different TTLs
      cache.set('short1', 'data1', 1000);
      cache.set('short2', 'data2', 1000);
      cache.set('long1', 'data3', 5000);
      cache.set('long2', 'data4', 5000);

      expect(cache.getStats().size).toBe(4);

      // Fast-forward past short TTL but before long TTL
      jest.advanceTimersByTime(1500);

      cache.cleanup();

      expect(cache.getStats().size).toBe(2);
      expect(cache.get('short1')).toBeUndefined();
      expect(cache.get('short2')).toBeUndefined();
      expect(cache.get('long1')).toBe('data3');
      expect(cache.get('long2')).toBe('data4');
    });

    it('should handle cleanup with no expired entries', () => {
      cache.set('key1', 'data1', 5000);
      cache.set('key2', 'data2', 5000);

      expect(cache.getStats().size).toBe(2);

      // Fast-forward but not past TTL
      jest.advanceTimersByTime(1000);

      cache.cleanup();

      expect(cache.getStats().size).toBe(2);
    });

    it('should handle cleanup on empty cache', () => {
      expect(cache.getStats().size).toBe(0);
      cache.cleanup();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('memory management', () => {
    it('should respect maxSize limit', () => {
      const smallCache = new MemoryCache({ maxSize: 3 });

      smallCache.set('key1', 'data1');
      smallCache.set('key2', 'data2');
      smallCache.set('key3', 'data3');

      expect(smallCache.getStats().size).toBe(3);

      // Adding 4th item should trigger cleanup/eviction
      smallCache.set('key4', 'data4');

      expect(smallCache.getStats().size).toBe(3);
      // First entry should be evicted (FIFO)
      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key4')).toBe('data4');
    });

    it('should cleanup expired entries before evicting', () => {
      jest.useFakeTimers();

      const smallCache = new MemoryCache({ maxSize: 2, ttl: 1000 });

      // Add entries that will expire
      smallCache.set('expired1', 'data1', 500);
      smallCache.set('expired2', 'data2', 500);

      // Fast-forward to expire them
      jest.advanceTimersByTime(1000);

      // Add new entry - should cleanup expired ones first
      smallCache.set('new1', 'newdata1');

      expect(smallCache.getStats().size).toBe(1);
      expect(smallCache.get('expired1')).toBeUndefined();
      expect(smallCache.get('expired2')).toBeUndefined();
      expect(smallCache.get('new1')).toBe('newdata1');

      jest.useRealTimers();
    });

    it("should handle eviction when cleanup doesn't free enough space", () => {
      const smallCache = new MemoryCache({ maxSize: 2 });

      // Fill cache to capacity
      smallCache.set('key1', 'data1');
      smallCache.set('key2', 'data2');

      expect(smallCache.getStats().size).toBe(2);

      // Add another entry - should evict oldest
      smallCache.set('key3', 'data3');

      expect(smallCache.getStats().size).toBe(2);
      expect(smallCache.get('key1')).toBeUndefined(); // Evicted
      expect(smallCache.get('key2')).toBe('data2');
      expect(smallCache.get('key3')).toBe('data3');
    });
  });

  describe('getStats method', () => {
    it('should return correct statistics', () => {
      const customCache = new MemoryCache({
        ttl: 10000,
        maxSize: 500,
      });

      const initialStats = customCache.getStats();
      expect(initialStats).toEqual({
        size: 0,
        maxSize: 500,
        defaultTtl: 10000,
        hits: 0,
        misses: 0,
        hitRate: 0,
      });

      customCache.set('key1', 'data1');
      customCache.set('key2', 'data2');

      const afterAddingStats = customCache.getStats();
      expect(afterAddingStats.size).toBe(2);
      expect(afterAddingStats.maxSize).toBe(500);
      expect(afterAddingStats.defaultTtl).toBe(10000);
    });

    it('should update size when entries are added/removed', () => {
      expect(cache.getStats().size).toBe(0);

      cache.set('key1', 'data1');
      expect(cache.getStats().size).toBe(1);

      cache.set('key2', 'data2');
      expect(cache.getStats().size).toBe(2);

      cache.delete('key1');
      expect(cache.getStats().size).toBe(1);

      cache.clear();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined and null values', () => {
      cache.set('undefined-key', undefined);
      cache.set('null-key', null);

      expect(cache.get('undefined-key')).toBeUndefined();
      expect(cache.get('null-key')).toBeNull();
      expect(cache.has('undefined-key')).toBe(true);
      expect(cache.has('null-key')).toBe(true);
    });

    it('should handle empty strings as keys', () => {
      cache.set('', 'empty key data');
      expect(cache.get('')).toBe('empty key data');
      expect(cache.has('')).toBe(true);
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      cache.set(longKey, 'long key data');

      expect(cache.get(longKey)).toBe('long key data');
      expect(cache.has(longKey)).toBe(true);
    });

    it('should handle zero TTL', () => {
      jest.useFakeTimers();

      cache.set('zero-ttl', 'data', 0);

      // Should expire immediately
      jest.advanceTimersByTime(1);
      expect(cache.get('zero-ttl')).toBeUndefined();

      jest.useRealTimers();
    });

    it('should handle negative TTL', () => {
      jest.useFakeTimers();

      cache.set('negative-ttl', 'data', -1000);

      // Should be expired immediately
      expect(cache.get('negative-ttl')).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('concurrent operations simulation', () => {
    it('should handle multiple rapid operations', () => {
      // Simulate rapid concurrent-like operations
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `data${i}`);
      }

      expect(cache.getStats().size).toBe(100);

      // Check all entries exist
      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key${i}`)).toBe(`data${i}`);
      }

      // Delete every other entry
      for (let i = 0; i < 100; i += 2) {
        cache.delete(`key${i}`);
      }

      expect(cache.getStats().size).toBe(50);

      // Verify correct entries remain
      for (let i = 1; i < 100; i += 2) {
        expect(cache.get(`key${i}`)).toBe(`data${i}`);
      }
    });
  });
});

describe('createCacheKey', () => {
  it('should create cache keys with prefix and parts', () => {
    const key = createCacheKey('http', 'GET', '/api/test', 'param1=value1');
    expect(key).toBe('http:GET:/api/test:param1=value1');
  });

  it('should handle different data types', () => {
    const key = createCacheKey('cache', 'string', 123, 'boolean');
    expect(key).toBe('cache:string:123:boolean');
  });

  it('should handle empty parts array', () => {
    const key = createCacheKey('prefix');
    expect(key).toBe('prefix:');
  });

  it('should handle numbers and strings', () => {
    const key = createCacheKey('test', 'part1', 42, 'part2');
    expect(key).toBe('test:part1:42:part2');
  });
});
