import { HealthChecker } from '../../src/utils/health-check';
import { HealthChecker as NodeHealthChecker } from '../../src/utils/health-check-node';
import { monitoringSystem } from '../../src/utils/monitoring';
import { monitoringSystem as nodeMonitoringSystem } from '../../src/utils/monitoring-node';
import { createNoopSpan, type RuntimeObservability } from '../../src/utils/observability';

const createSystemHealth = (status: 'healthy' | 'degraded' | 'unhealthy') => ({
  status,
  timestamp: 123,
  uptime: 456,
  memory: {
    used: 10,
    total: 100,
    percentage: 10,
  },
  api: {
    status,
    responseTime: 50,
    errorRate: 0,
  },
  cache: {
    hitRate: 0.9,
    size: 1,
    maxSize: 100,
  },
  rateLimit: {
    remaining: 9,
    limit: 10,
    resetTime: 789,
  },
});

const createObservability = (
  health: ReturnType<typeof createSystemHealth>
): RuntimeObservability => ({
  startSpan: jest.fn(() => createNoopSpan()),
  recordRequestMetrics: jest.fn(),
  recordError: jest.fn(),
  updateCacheMetrics: jest.fn(),
  updateRateLimitMetrics: jest.fn(),
  updateConnectionMetrics: jest.fn(),
  getHealth: jest.fn().mockResolvedValue(health),
  getMetrics: jest.fn().mockResolvedValue({}),
  cleanup: jest.fn(),
  shutdown: jest.fn(),
});

describe('HealthChecker observability seam', () => {
  afterAll(() => {
    monitoringSystem.cleanup();
    nodeMonitoringSystem.cleanup();
  });

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses injected observability for simple health checks', async () => {
    const health = createSystemHealth('healthy');
    const observability = createObservability(health);
    const healthChecker = new HealthChecker({ observability });

    await expect(healthChecker.isHealthy()).resolves.toBe(true);
    await expect(healthChecker.getHealth()).resolves.toEqual(health);
    expect(observability.getHealth).toHaveBeenCalledTimes(2);
  });

  it('treats unhealthy observability responses as not healthy', async () => {
    const health = createSystemHealth('unhealthy');
    const observability = createObservability(health);
    const healthChecker = new HealthChecker({ observability });

    await expect(healthChecker.isHealthy()).resolves.toBe(false);
    await expect(healthChecker.getHealth()).resolves.toEqual(health);
  });

  it('keeps detailed health report and custom check behavior', async () => {
    const observability = createObservability(createSystemHealth('healthy'));
    const healthChecker = new HealthChecker({
      version: 'test-version',
      serviceId: 'test-service',
      observability,
    });

    healthChecker.addCustomCheck('database', async () => ({
      status: 'warn',
      output: 'Database is reachable with elevated latency',
    }));

    const report = await healthChecker.getDetailedHealth();

    expect(report).toEqual(
      expect.objectContaining({
        status: 'warn',
        version: 'test-version',
        serviceId: 'test-service',
        description: 'PUBG TypeScript SDK Health Check',
      })
    );
    expect(report.checks.database).toEqual(
      expect.objectContaining({
        status: 'warn',
        componentId: 'database',
        componentType: 'custom',
      })
    );
    expect(report.checks.memory).toEqual(expect.objectContaining({ status: 'pass' }));

    healthChecker.removeCustomCheck('database');
    const reportAfterRemoval = await healthChecker.getDetailedHealth();

    expect(reportAfterRemoval.checks.database).toBeUndefined();
  });
});

describe('NodeHealthChecker observability seam', () => {
  it('uses injected observability for Node health checks', async () => {
    const health = createSystemHealth('degraded');
    const observability = createObservability(health);
    const healthChecker = new NodeHealthChecker({ observability });

    await expect(healthChecker.isHealthy()).resolves.toBe(false);
    await expect(healthChecker.getHealth()).resolves.toEqual(health);
    expect(observability.getHealth).toHaveBeenCalledTimes(2);
  });

  it('uses process-backed Node observability by default', async () => {
    const memoryUsage = {
      rss: 96 * 1024 * 1024,
      heapTotal: 64 * 1024 * 1024,
      heapUsed: 16 * 1024 * 1024,
      external: 8 * 1024 * 1024,
      arrayBuffers: 1 * 1024 * 1024,
    };
    const memoryUsageSpy = jest.spyOn(process, 'memoryUsage').mockReturnValue(memoryUsage);
    const healthChecker = new NodeHealthChecker();

    const health = await healthChecker.getHealth();

    expect(memoryUsageSpy).toHaveBeenCalled();
    expect(health.memory).toEqual({
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: 25,
    });
  });
});
