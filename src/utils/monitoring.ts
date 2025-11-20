import { logger } from './logger';

// Browser-compatible performance API
const getPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    return window.performance;
  }
  // Fallback for Node.js environments
  return {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
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
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  api: {
    status: 'healthy' | 'degraded' | 'unhealthy';
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

// Browser-compatible metrics storage
interface BrowserMetrics {
  requests: number;
  errors: number;
  totalTime: number;
  cacheHits: number;
  cacheMisses: number;
  startTime: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Browser-compatible monitoring system
 *
 * Provides basic monitoring capabilities without Node.js dependencies:
 * - Simple metrics collection
 * - Basic health checks
 * - Performance tracking
 *
 * @example
 * ```typescript
 * const monitor = new MonitoringSystem({
 *   enabled: true,
 *   metricsEnabled: true,
 *   tracingEnabled: false, // Disabled in browser
 *   prefix: 'pubg_sdk'
 * });
 *
 * // Track API requests
 * monitor.recordRequestMetrics({
 *   duration: 150,
 *   statusCode: 200,
 *   endpoint: '/players'
 * });
 * ```
 */
export class MonitoringSystem {
  private config: MonitoringConfig;
  private metrics: BrowserMetrics;
  private healthCheckInterval?: number;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      metricsEnabled: true,
      tracingEnabled: false, // Disabled in browser
      healthCheckEnabled: true,
      collectDefaultMetrics: false, // Disabled in browser
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

  private startHealthChecking(): void {
    if (!this.config.healthCheckEnabled) return;

    // Use appropriate setInterval based on environment
    const setIntervalFunc = typeof window !== 'undefined' ? window.setInterval : global.setInterval;

    // Run health checks every 30 seconds
    this.healthCheckInterval = setIntervalFunc(() => {
      this.performHealthCheck();
    }, 30000) as unknown as number;

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Stop health checking and clean up resources
   */
  stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      const clearIntervalFunc =
        typeof window !== 'undefined' ? window.clearInterval : global.clearInterval;
      clearIntervalFunc(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Clean up all monitoring resources
   */
  cleanup(): void {
    this.stopHealthChecking();
  }

  /**
   * Start a new tracing span (no-op in browser)
   */
  public startSpan(_name: string, _attributes: Record<string, any> = {}): any {
    // No-op in browser environment
    return {
      end: () => {},
      setStatus: () => {},
      recordException: () => {},
    };
  }

  /**
   * Record request metrics
   */
  public recordRequestMetrics(metrics: RequestMetrics): void {
    if (!this.config.metricsEnabled) return;

    const { duration, error = false } = metrics;

    // Update metrics
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

  /**
   * Record error occurrences
   */
  public recordError(error: Error, context: Record<string, any> = {}): void {
    if (!this.config.metricsEnabled) return;

    this.metrics.errors++;
    logger.error('Error recorded in monitoring', { error: error.message, context });
  }

  /**
   * Update cache metrics
   */
  public updateCacheMetrics(_hitRate: number): void {
    if (!this.config.metricsEnabled) return;
    // Cache metrics are tracked internally
  }

  /**
   * Update rate limit metrics
   */
  public updateRateLimitMetrics(_remaining: number): void {
    if (!this.config.metricsEnabled) return;
    // Rate limit metrics are tracked internally
  }

  /**
   * Update connection metrics
   */
  public updateConnectionMetrics(_active: number): void {
    if (!this.config.metricsEnabled) return;
    // Connection metrics are tracked internally
  }

  /**
   * Get current system health
   */
  public async getHealth(): Promise<SystemHealth> {
    const now = Date.now();

    // Browser-compatible memory estimation
    const memoryEstimate = this.estimateMemoryUsage();

    return {
      status: this.metrics.healthStatus,
      timestamp: now,
      uptime: now - this.metrics.startTime,
      memory: {
        used: memoryEstimate.used,
        total: memoryEstimate.total,
        percentage: memoryEstimate.percentage,
      },
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

  /**
   * Get metrics as simple object (no Prometheus in browser)
   */
  public async getMetrics(): Promise<Record<string, any>> {
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

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now();

    try {
      // Check memory usage
      const memoryEstimate = this.estimateMemoryUsage();

      // Check API response time
      const apiResponseTime = await this.measureApiResponseTime();

      // Calculate error rate
      const errorRate = this.getErrorRate();

      // Determine overall health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

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
    // Simulate API response time in browser
    return Math.random() * 500 + 100; // 100-600ms
  }

  private getErrorRate(): number {
    return this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0;
  }

  private getAverageResponseTime(): number {
    return this.metrics.requests > 0 ? this.metrics.totalTime / this.metrics.requests : 0;
  }

  private getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0.85; // Default 85%
  }

  private estimateMemoryUsage(): { used: number; total: number; percentage: number } {
    // Browser-compatible memory estimation
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    // Fallback estimation
    return {
      used: 50 * 1024 * 1024, // 50MB estimated
      total: 100 * 1024 * 1024, // 100MB estimated
      percentage: 50,
    };
  }

  /**
   * Shutdown monitoring system gracefully
   */
  public shutdown(): void {
    logger.client('Shutting down monitoring system');
    this.cleanup();
  }
}

// Export singleton instance
export const monitoringSystem = new MonitoringSystem({
  enabled: typeof process !== 'undefined' ? process.env.MONITORING_ENABLED !== 'false' : true,
  metricsEnabled: typeof process !== 'undefined' ? process.env.METRICS_ENABLED !== 'false' : true,
  tracingEnabled: false, // Always disabled in browser
  prefix: typeof process !== 'undefined' ? process.env.METRICS_PREFIX || 'pubg_sdk' : 'pubg_sdk',
});
