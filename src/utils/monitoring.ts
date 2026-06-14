import { BrowserRuntimeObservability } from './observability';

export type {
  MonitoringConfig,
  ObservabilitySpan,
  RequestMetrics,
  RuntimeObservability,
  SystemHealth,
} from './observability';

/**
 * Browser-compatible monitoring system.
 *
 * Compatibility wrapper for existing imports. Runtime behavior is implemented
 * by the shared observability adapter.
 */
export class MonitoringSystem extends BrowserRuntimeObservability {}

export const monitoringSystem = new MonitoringSystem({
  enabled: typeof process !== 'undefined' ? process.env.MONITORING_ENABLED !== 'false' : true,
  metricsEnabled: typeof process !== 'undefined' ? process.env.METRICS_ENABLED !== 'false' : true,
  tracingEnabled: false,
  prefix: typeof process !== 'undefined' ? process.env.METRICS_PREFIX || 'pubg_sdk' : 'pubg_sdk',
});
