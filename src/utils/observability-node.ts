import { logger } from './logger';
import {
  createNoopSpan,
  type MonitoringConfig,
  type ObservabilitySpan,
  type RequestMetrics,
  type RuntimeObservability,
  type SystemHealth,
} from './observability';

type HealthStatus = SystemHealth['status'];

interface RequestMetricRecord {
  method: string;
  endpoint: string;
  statusCode: string;
  statusClass: string;
  count: number;
  totalDuration: number;
}

interface NodeMetrics {
  requests: number;
  errors: number;
  totalTime: number;
  cacheHitRate: number;
  activeConnections: number;
  rateLimitRemaining: number;
  startTime: number;
  requestMetrics: Map<string, RequestMetricRecord>;
}

const defaultConfig = (): MonitoringConfig => ({
  enabled: process.env.MONITORING_ENABLED !== 'false',
  metricsEnabled: process.env.METRICS_ENABLED !== 'false',
  tracingEnabled: process.env.TRACING_ENABLED !== 'false',
  healthCheckEnabled: true,
  collectDefaultMetrics: true,
  prefix: process.env.METRICS_PREFIX || 'pubg_sdk',
});

export class NodeObservability implements RuntimeObservability {
  private config: MonitoringConfig;
  private metrics: NodeMetrics;
  private healthStatus: HealthStatus = 'healthy';
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      ...defaultConfig(),
      ...config,
    };

    this.metrics = {
      requests: 0,
      errors: 0,
      totalTime: 0,
      cacheHitRate: 0.85,
      activeConnections: 0,
      rateLimitRemaining: 8,
      startTime: Date.now(),
      requestMetrics: new Map(),
    };

    if (this.config.enabled) {
      this.startHealthChecking();
    }
  }

  startSpan(_name: string, _attributes: Record<string, unknown> = {}): ObservabilitySpan {
    // Tracing is intentionally a no-op until a real tracing dependency is added.
    return createNoopSpan();
  }

  recordRequestMetrics(metrics: RequestMetrics): void {
    if (!this.config.metricsEnabled) return;

    const {
      duration,
      statusCode = 0,
      endpoint = 'unknown',
      method = 'unknown',
      error = false,
    } = metrics;
    const statusClass = this.getStatusClass(statusCode);
    const key = `${method}:${endpoint}:${statusCode}:${statusClass}`;
    const existing = this.metrics.requestMetrics.get(key);

    this.metrics.requests++;
    this.metrics.totalTime += duration;

    if (error || statusCode >= 400) {
      this.metrics.errors++;
    }

    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
    } else {
      this.metrics.requestMetrics.set(key, {
        method,
        endpoint,
        statusCode: statusCode.toString(),
        statusClass,
        count: 1,
        totalDuration: duration,
      });
    }
  }

  recordError(error: Error, context: Record<string, unknown> = {}): void {
    if (!this.config.metricsEnabled) return;

    this.metrics.errors++;
    logger.error('Error recorded in node observability', { error: error.message, context });
  }

  updateCacheMetrics(hitRate: number): void {
    if (!this.config.metricsEnabled) return;
    this.metrics.cacheHitRate = hitRate;
  }

  updateRateLimitMetrics(remaining: number): void {
    if (!this.config.metricsEnabled) return;
    this.metrics.rateLimitRemaining = remaining;
  }

  updateConnectionMetrics(active: number): void {
    if (!this.config.metricsEnabled) return;
    this.metrics.activeConnections = active;
  }

  async getHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const memory = this.getMemoryHealth();

    return {
      status: this.healthStatus,
      timestamp: now,
      uptime: now - this.metrics.startTime,
      memory,
      api: {
        status: this.healthStatus,
        responseTime: await this.measureApiResponseTime(),
        errorRate: this.getErrorRate(),
      },
      cache: {
        hitRate: this.metrics.cacheHitRate,
        size: 0,
        maxSize: 100,
      },
      rateLimit: {
        remaining: this.metrics.rateLimitRemaining,
        limit: 10,
        resetTime: Date.now() + 60000,
      },
    };
  }

  async getMetrics(): Promise<Record<string, unknown>> {
    if (!this.config.metricsEnabled) {
      return { status: 'disabled' };
    }

    const memory = process.memoryUsage();

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.getErrorRate(),
      averageResponseTime: this.getAverageResponseTime(),
      cacheHitRate: this.metrics.cacheHitRate,
      rateLimitRemaining: this.metrics.rateLimitRemaining,
      activeConnections: this.metrics.activeConnections,
      uptime: Date.now() - this.metrics.startTime,
      healthStatus: this.healthStatus,
      prefix: this.config.prefix,
      requestMetrics: Array.from(this.metrics.requestMetrics.values()),
      memory,
    };
  }

  cleanup(): void {
    this.stopHealthChecking();
  }

  shutdown(): void {
    logger.client('Shutting down node observability');
    this.cleanup();
  }

  stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  protected startHealthChecking(): void {
    if (!this.config.healthCheckEnabled) return;

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const memory = this.getMemoryHealth();
      const errorRate = this.getErrorRate();
      const apiResponseTime = await this.measureApiResponseTime();

      if (memory.percentage > 90 || apiResponseTime > 5000 || errorRate > 0.1) {
        this.healthStatus = 'unhealthy';
      } else if (memory.percentage > 70 || apiResponseTime > 2000 || errorRate > 0.05) {
        this.healthStatus = 'degraded';
      } else {
        this.healthStatus = 'healthy';
      }
    } catch (error) {
      this.healthStatus = 'unhealthy';
      logger.error('Node health check failed', { error });
    }
  }

  private async measureApiResponseTime(): Promise<number> {
    return 0;
  }

  private getMemoryHealth(): SystemHealth['memory'] {
    const memory = process.memoryUsage();

    return {
      used: memory.heapUsed,
      total: memory.heapTotal,
      percentage: memory.heapTotal > 0 ? (memory.heapUsed / memory.heapTotal) * 100 : 0,
    };
  }

  private getErrorRate(): number {
    return this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0;
  }

  private getAverageResponseTime(): number {
    return this.metrics.requests > 0 ? this.metrics.totalTime / this.metrics.requests : 0;
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }
}

export const createNodeObservability = (
  config: Partial<MonitoringConfig> = {}
): RuntimeObservability => new NodeObservability(config);

export const nodeObservability = createNodeObservability({ healthCheckEnabled: false });
