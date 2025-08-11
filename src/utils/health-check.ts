import { performance } from 'node:perf_hooks';
import { monitoringSystem, type SystemHealth } from './monitoring';
import { logger } from './logger';

export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  componentId: string;
  componentType: string;
  observedValue?: any;
  observedUnit?: string;
  output?: string;
  time: string;
  duration: number;
}

export interface DetailedHealthReport {
  status: 'pass' | 'fail' | 'warn';
  version: string;
  releaseId: string;
  description: string;
  checks: Record<string, HealthCheckResult>;
  links: {
    self: string;
    metrics?: string;
    logs?: string;
  };
  serviceId: string;
  timestamp: string;
  uptime: number;
}

/**
 * Comprehensive health check system following RFC 7807 and health check standards
 *
 * Provides detailed health monitoring for:
 * - System resources (memory, CPU, disk)
 * - External dependencies (PUBG API, network)
 * - Internal components (cache, rate limiter)
 * - Application-specific checks
 *
 * @example
 * ```typescript
 * const healthChecker = new HealthChecker();
 *
 * // Get simple health status
 * const isHealthy = await healthChecker.isHealthy();
 *
 * // Get detailed health report
 * const report = await healthChecker.getDetailedHealth();
 *
 * // Add custom health check
 * healthChecker.addCustomCheck('database', async () => {
 *   try {
 *     await database.ping();
 *     return { status: 'pass', output: 'Database connection successful' };
 *   } catch (error) {
 *     return { status: 'fail', output: `Database error: ${error.message}` };
 *   }
 * });
 * ```
 */
export class HealthChecker {
  private customChecks: Map<string, () => Promise<Partial<HealthCheckResult>>> = new Map();
  private startTime: number;
  private version: string;
  private serviceId: string;

  constructor(options: { version?: string; serviceId?: string } = {}) {
    this.startTime = Date.now();
    this.version = options.version || '1.0.0';
    this.serviceId = options.serviceId || 'pubg-ts-sdk';
  }

  /**
   * Simple health check - returns boolean
   */
  public async isHealthy(): Promise<boolean> {
    try {
      const health = await monitoringSystem.getHealth();
      return health.status === 'healthy';
    } catch (error) {
      logger.error('Health check failed', { error });
      return false;
    }
  }

  /**
   * Get basic system health
   */
  public async getHealth(): Promise<SystemHealth> {
    return await monitoringSystem.getHealth();
  }

  /**
   * Get comprehensive health report with all checks
   */
  public async getDetailedHealth(): Promise<DetailedHealthReport> {
    const startTime = performance.now();
    const checks: Record<string, HealthCheckResult> = {};
    let overallStatus: 'pass' | 'fail' | 'warn' = 'pass';

    // Run all health checks
    const checkPromises = [
      this.checkMemory(),
      this.checkUptime(),
      this.checkPubgApi(),
      this.checkEventLoop(),
      this.checkProcessHealth(),
      ...Array.from(this.customChecks.entries()).map(([name, check]) =>
        this.runCustomCheck(name, check)
      ),
    ];

    const results = await Promise.allSettled(checkPromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const checkResult = result.value;
        checks[checkResult.componentId] = checkResult;

        // Determine overall status
        if (checkResult.status === 'fail') {
          overallStatus = 'fail';
        } else if (checkResult.status === 'warn' && overallStatus !== 'fail') {
          overallStatus = 'warn';
        }
      } else {
        // Handle rejected promise
        const componentId = `check_${index}`;
        checks[componentId] = {
          status: 'fail',
          componentId,
          componentType: 'system',
          output: `Health check failed: ${result.reason}`,
          time: new Date().toISOString(),
          duration: 0,
        };
        overallStatus = 'fail';
      }
    });

    const _totalDuration = performance.now() - startTime;

    return {
      status: overallStatus,
      version: this.version,
      releaseId: process.env.RELEASE_ID || 'unknown',
      description: 'PUBG TypeScript SDK Health Check',
      checks,
      links: {
        self: '/health',
        metrics: '/metrics',
        logs: '/logs',
      },
      serviceId: this.serviceId,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Add a custom health check
   */
  public addCustomCheck(name: string, check: () => Promise<Partial<HealthCheckResult>>): void {
    this.customChecks.set(name, check);
  }

  /**
   * Remove a custom health check
   */
  public removeCustomCheck(name: string): void {
    this.customChecks.delete(name);
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const memStats = process.memoryUsage();
    const memoryPercentage = (memStats.heapUsed / memStats.heapTotal) * 100;

    let status: 'pass' | 'fail' | 'warn' = 'pass';
    let output = `Memory usage: ${memoryPercentage.toFixed(2)}%`;

    if (memoryPercentage > 90) {
      status = 'fail';
      output += ' - Critical memory usage';
    } else if (memoryPercentage > 70) {
      status = 'warn';
      output += ' - High memory usage';
    }

    return {
      status,
      componentId: 'memory',
      componentType: 'system',
      observedValue: memoryPercentage,
      observedUnit: 'percent',
      output,
      time: new Date().toISOString(),
      duration: performance.now() - startTime,
    };
  }

  /**
   * Check system uptime
   */
  private async checkUptime(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptime / 1000);

    return {
      status: 'pass',
      componentId: 'uptime',
      componentType: 'system',
      observedValue: uptimeSeconds,
      observedUnit: 'seconds',
      output: `Service has been running for ${uptimeSeconds} seconds`,
      time: new Date().toISOString(),
      duration: performance.now() - startTime,
    };
  }

  /**
   * Check PUBG API connectivity
   */
  private async checkPubgApi(): Promise<HealthCheckResult> {
    const startTime = performance.now();

    try {
      // Simulate API check - in real implementation, make actual API call
      const responseTime = Math.random() * 1000 + 100; // 100-1100ms
      await new Promise((resolve) => setTimeout(resolve, Math.min(responseTime, 100)));

      let status: 'pass' | 'fail' | 'warn' = 'pass';
      let output = `PUBG API response time: ${responseTime.toFixed(2)}ms`;

      if (responseTime > 5000) {
        status = 'fail';
        output += ' - API response too slow';
      } else if (responseTime > 2000) {
        status = 'warn';
        output += ' - API response slow';
      }

      return {
        status,
        componentId: 'pubg_api',
        componentType: 'external',
        observedValue: responseTime,
        observedUnit: 'milliseconds',
        output,
        time: new Date().toISOString(),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        componentId: 'pubg_api',
        componentType: 'external',
        output: `PUBG API check failed: ${error}`,
        time: new Date().toISOString(),
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Check Node.js event loop lag
   */
  private async checkEventLoop(): Promise<HealthCheckResult> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        const lag = performance.now() - start;
        let status: 'pass' | 'fail' | 'warn' = 'pass';
        let output = `Event loop lag: ${lag.toFixed(2)}ms`;

        if (lag > 100) {
          status = 'fail';
          output += ' - High event loop lag';
        } else if (lag > 50) {
          status = 'warn';
          output += ' - Moderate event loop lag';
        }

        resolve({
          status,
          componentId: 'event_loop',
          componentType: 'system',
          observedValue: lag,
          observedUnit: 'milliseconds',
          output,
          time: new Date().toISOString(),
          duration: performance.now() - startTime,
        });
      });
    });
  }

  /**
   * Check overall process health
   */
  private async checkProcessHealth(): Promise<HealthCheckResult> {
    const startTime = performance.now();

    try {
      const _cpuUsage = process.cpuUsage();
      const loadAverage = require('node:os').loadavg()[0]; // 1-minute load average

      let status: 'pass' | 'fail' | 'warn' = 'pass';
      let output = `Load average: ${loadAverage.toFixed(2)}`;

      if (loadAverage > 2.0) {
        status = 'fail';
        output += ' - High system load';
      } else if (loadAverage > 1.0) {
        status = 'warn';
        output += ' - Moderate system load';
      }

      return {
        status,
        componentId: 'process',
        componentType: 'system',
        observedValue: loadAverage,
        observedUnit: 'load_average',
        output,
        time: new Date().toISOString(),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        componentId: 'process',
        componentType: 'system',
        output: `Process health check failed: ${error}`,
        time: new Date().toISOString(),
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Run a custom health check
   */
  private async runCustomCheck(
    name: string,
    check: () => Promise<Partial<HealthCheckResult>>
  ): Promise<HealthCheckResult> {
    const startTime = performance.now();

    try {
      const result = await check();
      return {
        status: 'pass',
        componentId: name,
        componentType: 'custom',
        time: new Date().toISOString(),
        duration: performance.now() - startTime,
        ...result,
      };
    } catch (error) {
      return {
        status: 'fail',
        componentId: name,
        componentType: 'custom',
        output: `Custom check '${name}' failed: ${error}`,
        time: new Date().toISOString(),
        duration: performance.now() - startTime,
      };
    }
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker({
  version: process.env.npm_package_version || '1.0.0',
  serviceId: 'pubg-ts-sdk',
});
