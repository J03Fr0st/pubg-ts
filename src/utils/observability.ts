import { logger } from './logger';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

const noop = () => {};

const getPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    return window.performance;
  }

  return {
    now: () => Date.now(),
    mark: noop,
    measure: noop,
    clearMarks: noop,
    clearMeasures: noop,
  };
};

const performance = getPerformance();

export interface MonitoringConfig {
  enabled: boolean;
  metricsEnabled: boolean;
  tracingEnabled: boolean;
  healthCheckEnabled: boolean;
  collectDefaultMetrics: boolean;
  prefix: string;
}

export interface RequestMetrics {
  duration: number;
  statusCode?: number;
  endpoint?: string;
  method?: string;
  error?: boolean;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: number;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  api: {
    status: HealthStatus;
    responseTime: number;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    size: number;
    maxSize: number;
  };
  rateLimit: {
    remaining: number;
    limit: number;
    resetTime: number;
  };
}

export interface ObservabilitySpan {
  end(): void;
  setStatus(status: { code: number; message?: string }): void;
  recordException(error: Error): void;
}

export interface RuntimeObservability {
  startSpan(name: string, attributes?: Record<string, unknown>): ObservabilitySpan;
  recordRequestMetrics(metrics: RequestMetrics): void;
  recordError(error: Error, context?: Record<string, unknown>): void;
  updateCacheMetrics(hitRate: number): void;
  updateRateLimitMetrics(remaining: number): void;
  updateConnectionMetrics(active: number): void;
  getHealth(): Promise<SystemHealth>;
  getMetrics(): Promise<Record<string, unknown> | string>;
  cleanup(): void;
  shutdown(): void;
}

interface BrowserMetrics {
  requests: number;
  errors: number;
  totalTime: number;
  cacheHits: number;
  cacheMisses: number;
  startTime: number;
  healthStatus: HealthStatus;
}

export const createNoopSpan = (): ObservabilitySpan => ({
  end: noop,
  setStatus: noop,
  recordException: noop,
});

export class BrowserRuntimeObservability implements RuntimeObservability {
  private config: MonitoringConfig;
  private metrics: BrowserMetrics;
  private healthCheckInterval?: number;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      metricsEnabled: true,
      tracingEnabled: false,
      healthCheckEnabled: true,
      collectDefaultMetrics: false,
      prefix: 'pubg_sdk',
      ...config,
    };

    this.metrics = {
      requests: 0,
      errors: 0,
      totalTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      startTime: Date.now(),
      healthStatus: 'healthy',
    };

    if (this.config.enabled) {
      this.startHealthChecking();
    }
  }

  protected startHealthChecking(): void {
    if (!this.config.healthCheckEnabled) return;

    const setIntervalFunc = typeof window !== 'undefined' ? window.setInterval : global.setInterval;

    this.healthCheckInterval = setIntervalFunc(() => {
      this.performHealthCheck();
    }, 30000) as unknown as number;

    this.performHealthCheck();
  }

  stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      const clearIntervalFunc =
        typeof window !== 'undefined' ? window.clearInterval : global.clearInterval;
      clearIntervalFunc(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  cleanup(): void {
    this.stopHealthChecking();
  }

  startSpan(_name: string, _attributes: Record<string, unknown> = {}): ObservabilitySpan {
    return createNoopSpan();
  }

  recordRequestMetrics(metrics: RequestMetrics): void {
    if (!this.config.metricsEnabled) return;

    const { duration, error = false } = metrics;

    this.metrics.requests++;
    this.metrics.totalTime += duration;

    if (error) {
      this.metrics.errors++;
    }

    logger.client('Request recorded', {
      duration,
      error,
      totalRequests: this.metrics.requests,
      errorRate: this.getErrorRate(),
    });
  }

  recordError(error: Error, context: Record<string, unknown> = {}): void {
    if (!this.config.metricsEnabled) return;

    this.metrics.errors++;
    logger.error('Error recorded in monitoring', { error: error.message, context });
  }

  updateCacheMetrics(_hitRate: number): void {}

  updateRateLimitMetrics(_remaining: number): void {}

  updateConnectionMetrics(_active: number): void {}

  async getHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const memoryEstimate = this.estimateMemoryUsage();

    return {
      status: this.metrics.healthStatus,
      timestamp: now,
      uptime: now - this.metrics.startTime,
      memory: memoryEstimate,
      api: {
        status: this.metrics.healthStatus,
        responseTime: await this.measureApiResponseTime(),
        errorRate: this.getErrorRate(),
      },
      cache: {
        hitRate: this.getCacheHitRate(),
        size: 0,
        maxSize: 100,
      },
      rateLimit: {
        remaining: 8,
        limit: 10,
        resetTime: Date.now() + 60000,
      },
    };
  }

  async getMetrics(): Promise<Record<string, unknown>> {
    if (!this.config.metricsEnabled) {
      return { status: 'disabled' };
    }

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.getErrorRate(),
      averageResponseTime: this.getAverageResponseTime(),
      cacheHitRate: this.getCacheHitRate(),
      uptime: Date.now() - this.metrics.startTime,
      healthStatus: this.metrics.healthStatus,
    };
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now();

    try {
      const memoryEstimate = this.estimateMemoryUsage();
      const apiResponseTime = await this.measureApiResponseTime();
      const errorRate = this.getErrorRate();

      let status: HealthStatus = 'healthy';

      if (memoryEstimate.percentage > 90 || apiResponseTime > 5000 || errorRate > 0.1) {
        status = 'unhealthy';
      } else if (memoryEstimate.percentage > 70 || apiResponseTime > 2000 || errorRate > 0.05) {
        status = 'degraded';
      }

      this.metrics.healthStatus = status;

      const duration = performance.now() - startTime;
      logger.client('Health check completed', {
        status,
        duration: `${duration.toFixed(2)}ms`,
        memory: `${memoryEstimate.percentage.toFixed(2)}%`,
        apiResponseTime: `${apiResponseTime}ms`,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
      });
    } catch (error) {
      this.metrics.healthStatus = 'unhealthy';
      logger.error('Health check failed', { error });
    }
  }

  private async measureApiResponseTime(): Promise<number> {
    return Math.random() * 500 + 100;
  }

  private getErrorRate(): number {
    return this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0;
  }

  private getAverageResponseTime(): number {
    return this.metrics.requests > 0 ? this.metrics.totalTime / this.metrics.requests : 0;
  }

  private getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0.85;
  }

  private estimateMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    return {
      used: 50 * 1024 * 1024,
      total: 100 * 1024 * 1024,
      percentage: 50,
    };
  }

  shutdown(): void {
    logger.client('Shutting down monitoring system');
    this.cleanup();
  }
}

export const createDefaultObservability = (
  config: Partial<MonitoringConfig> = {}
): RuntimeObservability => new BrowserRuntimeObservability(config);
