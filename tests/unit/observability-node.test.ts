import { MonitoringSystem, monitoringSystem } from '../../src/utils/monitoring-node';
import type { MonitoringConfig } from '../../src/utils/observability';
import {
  createNodeObservability,
  NodeObservability,
  nodeObservability,
} from '../../src/utils/observability-node';

const createTestObservability = (config: Partial<MonitoringConfig> = {}) =>
  new NodeObservability({ healthCheckEnabled: false, ...config });

describe('node observability adapter', () => {
  const memoryUsage = {
    rss: 120 * 1024 * 1024,
    heapTotal: 80 * 1024 * 1024,
    heapUsed: 40 * 1024 * 1024,
    external: 10 * 1024 * 1024,
    arrayBuffers: 2 * 1024 * 1024,
  };

  beforeEach(() => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue(memoryUsage);
  });

  afterEach(() => {
    nodeObservability.cleanup();
    monitoringSystem.cleanup();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('returns process memory in health data', async () => {
    const observability = createTestObservability();

    const health = await observability.getHealth();

    expect(health.memory).toEqual({
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: 50,
    });
    expect(health.api).toEqual(
      expect.objectContaining({
        status: 'healthy',
        errorRate: 0,
      })
    );
    expect(health.cache.hitRate).toBe(0.85);
    expect(health.rateLimit.remaining).toBe(8);
  });

  it('returns structured metrics with status class labels when prometheus is unavailable', async () => {
    const observability = createTestObservability();

    observability.recordRequestMetrics({
      duration: 120,
      method: 'GET',
      endpoint: '/players',
      statusCode: 200,
    });
    observability.recordRequestMetrics({
      duration: 240,
      method: 'GET',
      endpoint: '/players',
      statusCode: 404,
    });
    observability.recordError(new TypeError('bad input'), { endpoint: '/players', code: 'EINVAL' });
    observability.updateCacheMetrics(0.75);
    observability.updateRateLimitMetrics(3);
    observability.updateConnectionMetrics(2);

    const metrics = await observability.getMetrics();

    expect(metrics).toEqual(
      expect.objectContaining({
        requests: 2,
        errors: 2,
        errorRate: 1,
        averageResponseTime: 180,
        cacheHitRate: 0.75,
        rateLimitRemaining: 3,
        activeConnections: 2,
        prefix: 'pubg_sdk',
      })
    );
    expect(metrics).toEqual(
      expect.objectContaining({
        requestMetrics: [
          {
            method: 'GET',
            endpoint: '/players',
            statusCode: '200',
            statusClass: '2xx',
            count: 1,
            totalDuration: 120,
          },
          {
            method: 'GET',
            endpoint: '/players',
            statusCode: '404',
            statusClass: '4xx',
            count: 1,
            totalDuration: 240,
          },
        ],
        memory: expect.objectContaining({
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
        }),
      })
    );
  });

  it('uses no-op spans even when tracing is enabled without tracing dependencies', () => {
    const observability = createTestObservability({ tracingEnabled: true });

    const span = observability.startSpan('api_request', { endpoint: '/players' });

    expect(() => {
      span.setStatus({ code: 1, message: 'ok' });
      span.recordException(new Error('test'));
      span.end();
    }).not.toThrow();
  });

  it('cleans up health check timers', () => {
    jest.useFakeTimers();
    const observability = createNodeObservability();

    expect(jest.getTimerCount()).toBe(1);

    observability.cleanup();

    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps the nodeObservability compatibility export from owning a health check timer', () => {
    expect(nodeObservability).toBeInstanceOf(NodeObservability);

    nodeObservability.cleanup();
  });

  it('returns disabled metrics status when metrics are disabled', async () => {
    const observability = createTestObservability({ metricsEnabled: false });

    observability.recordRequestMetrics({ duration: 100, statusCode: 500, error: true });
    observability.recordError(new Error('ignored'));

    await expect(observability.getMetrics()).resolves.toEqual({ status: 'disabled' });
  });
});

describe('node monitoring compatibility exports', () => {
  it('exports a MonitoringSystem singleton with class-compatible methods', () => {
    expect(monitoringSystem).toBeInstanceOf(MonitoringSystem);
    expect(monitoringSystem).toBeInstanceOf(NodeObservability);
    expect(monitoringSystem.stopHealthChecking).toEqual(expect.any(Function));
  });

  it('delegates MonitoringSystem to the node adapter', async () => {
    const monitor = new MonitoringSystem({ healthCheckEnabled: false });

    monitor.recordRequestMetrics({ duration: 25, statusCode: 204 });

    await expect(monitor.getMetrics()).resolves.toEqual(
      expect.objectContaining({
        requests: 1,
      })
    );
    expect(monitor).toBeInstanceOf(NodeObservability);
  });
});
