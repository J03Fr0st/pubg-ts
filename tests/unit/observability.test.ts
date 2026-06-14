import {
  MonitoringSystem,
  monitoringSystem,
  type RequestMetrics,
  type SystemHealth,
} from '../../src/utils/monitoring';
import {
  BrowserRuntimeObservability,
  createNoopSpan,
  type RuntimeObservability,
} from '../../src/utils/observability';

describe('runtime observability', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates safe no-op spans', () => {
    const span = createNoopSpan();

    expect(() => {
      span.setStatus({ code: 1, message: 'ok' });
      span.recordException(new Error('test'));
      span.end();
    }).not.toThrow();
  });

  it('records request and error metrics through the runtime interface', async () => {
    const observability: RuntimeObservability = new BrowserRuntimeObservability({
      healthCheckEnabled: false,
    });

    observability.recordRequestMetrics({
      duration: 100,
      statusCode: 200,
      endpoint: '/players',
      method: 'GET',
    });
    observability.recordRequestMetrics({
      duration: 300,
      statusCode: 500,
      endpoint: '/players',
      method: 'GET',
      error: true,
    });
    observability.recordError(new Error('manual'), { endpoint: '/players' });

    const metrics = await observability.getMetrics();

    expect(metrics).toEqual(
      expect.objectContaining({
        requests: 2,
        errors: 2,
        errorRate: 1,
        averageResponseTime: 200,
        cacheHitRate: 0.85,
        healthStatus: 'healthy',
      })
    );
  });

  it('returns browser-compatible health data', async () => {
    const observability = new BrowserRuntimeObservability({
      healthCheckEnabled: false,
    });

    const health = await observability.getHealth();

    expect(health).toEqual(
      expect.objectContaining({
        status: 'healthy',
        memory: {
          used: 50 * 1024 * 1024,
          total: 100 * 1024 * 1024,
          percentage: 50,
        },
        api: expect.objectContaining({
          status: 'healthy',
          errorRate: 0,
        }),
        cache: {
          hitRate: 0.85,
          size: 0,
          maxSize: 100,
        },
        rateLimit: expect.objectContaining({
          remaining: 8,
          limit: 10,
        }),
      })
    );
    expect(health.timestamp).toEqual(expect.any(Number));
    expect(health.uptime).toEqual(expect.any(Number));
    expect(health.api.responseTime).toBeGreaterThanOrEqual(100);
    expect(health.api.responseTime).toBeLessThan(600);
  });

  it('returns disabled metrics status when metrics are disabled', async () => {
    const observability = new BrowserRuntimeObservability({
      healthCheckEnabled: false,
      metricsEnabled: false,
    });

    observability.recordRequestMetrics({ duration: 100, error: true });
    observability.recordError(new Error('ignored'));

    await expect(observability.getMetrics()).resolves.toEqual({ status: 'disabled' });
  });

  it('cleans up health check timers', () => {
    jest.useFakeTimers();
    const observability = new BrowserRuntimeObservability();

    expect(jest.getTimerCount()).toBe(1);

    observability.cleanup();

    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('monitoring compatibility exports', () => {
  it('preserves MonitoringSystem as the browser-compatible implementation', () => {
    const monitor = new MonitoringSystem({ healthCheckEnabled: false });

    expect(monitor).toBeInstanceOf(BrowserRuntimeObservability);
    expect(monitor.startSpan('request')).toEqual(
      expect.objectContaining({
        end: expect.any(Function),
        setStatus: expect.any(Function),
        recordException: expect.any(Function),
      })
    );
  });

  it('preserves exported monitoring types and singleton cleanup', async () => {
    const metrics: RequestMetrics = { duration: 10 };
    const health: SystemHealth = await monitoringSystem.getHealth();

    monitoringSystem.recordRequestMetrics(metrics);

    expect(health.status).toEqual(expect.any(String));
    expect(typeof monitoringSystem.cleanup).toBe('function');
  });
});
