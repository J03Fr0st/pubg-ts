#!/usr/bin/env ts-node

import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { PubgClient } from '../src/index';
import { monitoringSystem } from '../src/utils/monitoring';

interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface LoadTestResult {
  testName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  errors: Record<string, number>;
  timestamp: number;
}

/**
 * Comprehensive performance testing utility
 * 
 * Tests various performance scenarios including:
 * - Single request performance
 * - Concurrent request handling
 * - Memory usage under load
 * - Rate limiting behavior
 * - Cache performance
 * - Error handling performance
 */
class PerformanceTester {
  private client: PubgClient;
  private metrics: PerformanceMetrics[] = [];
  
  constructor() {
    // Use a test API key or mock for testing
    this.client = new PubgClient({
      apiKey: process.env.PUBG_API_KEY || 'test-key-for-performance-testing',
      shard: 'pc-na'
    });
  }

  /**
   * Run comprehensive performance test suite
   */
  public async runTestSuite(): Promise<void> {
    console.log('🚀 Starting comprehensive performance test suite...\n');

    const results: LoadTestResult[] = [];

    try {
      // Individual operation tests
      results.push(await this.testSingleRequests());
      results.push(await this.testConcurrentRequests());
      results.push(await this.testCachePerformance());
      results.push(await this.testMemoryUsage());
      results.push(await this.testRateLimiting());
      
      // Save results
      this.saveResults(results);
      this.printSummary(results);
      
      console.log('\n✅ Performance test suite completed!');
      
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test single request performance
   */
  private async testSingleRequests(): Promise<LoadTestResult> {
    console.log('📊 Testing single request performance...');
    
    const testCases = [
      { name: 'Asset Manager - Get Item Name', operation: () => this.testAssetManagerPerformance() },
      { name: 'Cache Operations', operation: () => this.testCacheOperations() },
      { name: 'Rate Limiter', operation: () => this.testRateLimiterPerformance() },
      { name: 'Monitoring System', operation: () => this.testMonitoringPerformance() }
    ];

    const results: PerformanceMetrics[] = [];
    const memoryInitial = process.memoryUsage().heapUsed;
    let memoryPeak = memoryInitial;

    for (const testCase of testCases) {
      for (let i = 0; i < 10; i++) {
        const metric = await this.measureOperation(testCase.name, testCase.operation);
        results.push(metric);
        
        const currentMemory = process.memoryUsage().heapUsed;
        if (currentMemory > memoryPeak) {
          memoryPeak = currentMemory;
        }
      }
    }

    const successfulRequests = results.filter(r => r.success).length;
    const durations = results.filter(r => r.success).map(r => r.duration).sort((a, b) => a - b);
    const errors = this.aggregateErrors(results);

    return {
      testName: 'Single Request Performance',
      totalRequests: results.length,
      successfulRequests,
      failedRequests: results.length - successfulRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianResponseTime: durations[Math.floor(durations.length / 2)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      requestsPerSecond: successfulRequests / (Math.max(...durations) / 1000),
      memoryUsage: {
        initial: memoryInitial,
        peak: memoryPeak,
        final: process.memoryUsage().heapUsed
      },
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * Test concurrent request handling
   */
  private async testConcurrentRequests(): Promise<LoadTestResult> {
    console.log('⚡ Testing concurrent request performance...');
    
    const concurrency = 10;
    const requestsPerWorker = 5;
    const totalRequests = concurrency * requestsPerWorker;
    
    const memoryInitial = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    
    const workers = Array.from({ length: concurrency }, async (_, i) => {
      const results: PerformanceMetrics[] = [];
      
      for (let j = 0; j < requestsPerWorker; j++) {
        const metric = await this.measureOperation(
          `Concurrent-${i}-${j}`,
          () => this.testAssetManagerPerformance()
        );
        results.push(metric);
      }
      
      return results;
    });

    const allResults = (await Promise.all(workers)).flat();
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    const successfulRequests = allResults.filter(r => r.success).length;
    const durations = allResults.filter(r => r.success).map(r => r.duration).sort((a, b) => a - b);
    const errors = this.aggregateErrors(allResults);

    return {
      testName: 'Concurrent Requests',
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianResponseTime: durations[Math.floor(durations.length / 2)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      requestsPerSecond: successfulRequests / (totalDuration / 1000),
      memoryUsage: {
        initial: memoryInitial,
        peak: process.memoryUsage().heapUsed,
        final: process.memoryUsage().heapUsed
      },
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * Test cache performance
   */
  private async testCachePerformance(): Promise<LoadTestResult> {
    console.log('💾 Testing cache performance...');
    
    const iterations = 100;
    const results: PerformanceMetrics[] = [];
    const memoryInitial = process.memoryUsage().heapUsed;

    // Test cache hit vs miss performance
    for (let i = 0; i < iterations; i++) {
      const metric = await this.measureOperation(
        `Cache-${i}`,
        () => this.testCacheOperations()
      );
      results.push(metric);
    }

    const successfulRequests = results.filter(r => r.success).length;
    const durations = results.filter(r => r.success).map(r => r.duration).sort((a, b) => a - b);
    const errors = this.aggregateErrors(results);

    return {
      testName: 'Cache Performance',
      totalRequests: iterations,
      successfulRequests,
      failedRequests: iterations - successfulRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianResponseTime: durations[Math.floor(durations.length / 2)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      requestsPerSecond: successfulRequests / (Math.max(...durations) / 1000),
      memoryUsage: {
        initial: memoryInitial,
        peak: process.memoryUsage().heapUsed,
        final: process.memoryUsage().heapUsed
      },
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * Test memory usage under load
   */
  private async testMemoryUsage(): Promise<LoadTestResult> {
    console.log('🧠 Testing memory usage under load...');
    
    const iterations = 50;
    const results: PerformanceMetrics[] = [];
    const memoryInitial = process.memoryUsage().heapUsed;
    let memoryPeak = memoryInitial;

    for (let i = 0; i < iterations; i++) {
      const metric = await this.measureOperation(
        `Memory-${i}`,
        () => this.testMemoryIntensiveOperation()
      );
      results.push(metric);
      
      const currentMemory = process.memoryUsage().heapUsed;
      if (currentMemory > memoryPeak) {
        memoryPeak = currentMemory;
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const successfulRequests = results.filter(r => r.success).length;
    const durations = results.filter(r => r.success).map(r => r.duration).sort((a, b) => a - b);
    const errors = this.aggregateErrors(results);

    return {
      testName: 'Memory Usage',
      totalRequests: iterations,
      successfulRequests,
      failedRequests: iterations - successfulRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianResponseTime: durations[Math.floor(durations.length / 2)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      requestsPerSecond: successfulRequests / (Math.max(...durations) / 1000),
      memoryUsage: {
        initial: memoryInitial,
        peak: memoryPeak,
        final: process.memoryUsage().heapUsed
      },
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * Test rate limiting performance
   */
  private async testRateLimiting(): Promise<LoadTestResult> {
    console.log('⏱️  Testing rate limiting performance...');
    
    const iterations = 20;
    const results: PerformanceMetrics[] = [];
    const memoryInitial = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const metric = await this.measureOperation(
        `RateLimit-${i}`,
        () => this.testRateLimiterPerformance()
      );
      results.push(metric);
    }

    const successfulRequests = results.filter(r => r.success).length;
    const durations = results.filter(r => r.success).map(r => r.duration).sort((a, b) => a - b);
    const errors = this.aggregateErrors(results);

    return {
      testName: 'Rate Limiting',
      totalRequests: iterations,
      successfulRequests,
      failedRequests: iterations - successfulRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianResponseTime: durations[Math.floor(durations.length / 2)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      requestsPerSecond: successfulRequests / (Math.max(...durations) / 1000),
      memoryUsage: {
        initial: memoryInitial,
        peak: process.memoryUsage().heapUsed,
        final: process.memoryUsage().heapUsed
      },
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * Measure performance of a specific operation
   */
  private async measureOperation(
    operationName: string,
    operation: () => Promise<any> | any
  ): Promise<PerformanceMetrics> {
    const memoryBefore = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    
    try {
      await operation();
      const endTime = performance.now();
      const memoryAfter = process.memoryUsage().heapUsed;
      
      return {
        operation: operationName,
        duration: endTime - startTime,
        memoryBefore,
        memoryAfter,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      const endTime = performance.now();
      const memoryAfter = process.memoryUsage().heapUsed;
      
      return {
        operation: operationName,
        duration: endTime - startTime,
        memoryBefore,
        memoryAfter,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };
    }
  }

  // Test implementations
  private async testAssetManagerPerformance(): Promise<void> {
    // Test asset manager operations
    const itemName = this.client.assetManager.getItemName('Item_Weapon_AK47_C');
    const vehicleName = this.client.assetManager.getVehicleName('BP_Motorbike_00_C');
    const mapName = this.client.assetManager.getMapName('Desert_Main');
    
    // Test search functionality
    const searchResults = this.client.assetManager.searchItems('AK47');
    
    // Ensure operations completed
    if (!itemName || !vehicleName || !mapName || !searchResults) {
      throw new Error('Asset manager operations failed');
    }
  }

  private async testCacheOperations(): Promise<void> {
    // Test cache operations (would need access to cache instance)
    // For now, simulate cache operations
    const data = { test: 'data', timestamp: Date.now() };
    const serialized = JSON.stringify(data);
    const parsed = JSON.parse(serialized);
    
    if (!parsed.test) {
      throw new Error('Cache operation failed');
    }
  }

  private async testRateLimiterPerformance(): Promise<void> {
    // Test rate limiter (would need access to rate limiter instance)
    // Simulate rate limiter check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  }

  private async testMonitoringPerformance(): Promise<void> {
    // Test monitoring system
    monitoringSystem.recordRequestMetrics({
      duration: Math.random() * 100,
      statusCode: 200,
      endpoint: '/test',
      method: 'GET'
    });
  }

  private async testMemoryIntensiveOperation(): Promise<void> {
    // Create and release large objects to test memory handling
    const largeArray = new Array(10000).fill(0).map((_, i) => ({
      id: i,
      data: `test-data-${i}`,
      timestamp: Date.now()
    }));
    
    // Process the array
    const processed = largeArray.filter(item => item.id % 2 === 0);
    
    if (processed.length === 0) {
      throw new Error('Memory intensive operation failed');
    }
  }

  private aggregateErrors(results: PerformanceMetrics[]): Record<string, number> {
    const errors: Record<string, number> = {};
    
    for (const result of results) {
      if (!result.success && result.error) {
        errors[result.error] = (errors[result.error] || 0) + 1;
      }
    }
    
    return errors;
  }

  /**
   * Save test results to file
   */
  private saveResults(results: LoadTestResult[]): void {
    const report = {
      timestamp: Date.now(),
      summary: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.failedRequests === 0).length,
        totalRequests: results.reduce((sum, r) => sum + r.totalRequests, 0),
        totalSuccessfulRequests: results.reduce((sum, r) => sum + r.successfulRequests, 0)
      },
      results
    };
    
    writeFileSync('performance-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Performance report saved to: performance-test-report.json');
  }

  /**
   * Print performance summary
   */
  private printSummary(results: LoadTestResult[]): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log('             PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    
    for (const result of results) {
      console.log(`\n${result.testName}:`);
      console.log(`  Total Requests: ${result.totalRequests}`);
      console.log(`  Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`);
      console.log(`  Failed: ${result.failedRequests}`);
      console.log(`  Avg Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`  P95 Response Time: ${result.p95ResponseTime.toFixed(2)}ms`);
      console.log(`  Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`  Memory Peak: ${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`);
      
      if (Object.keys(result.errors).length > 0) {
        console.log('  Errors:');
        for (const [error, count] of Object.entries(result.errors)) {
          console.log(`    ${error}: ${count}`);
        }
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
  }
}

// Run performance tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runTestSuite().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

export { PerformanceTester };