import { NodeObservability } from './observability-node';

export type {
  MonitoringConfig,
  ObservabilitySpan,
  RequestMetrics,
  RuntimeObservability,
  SystemHealth,
} from './observability';

/**
 * Node monitoring compatibility wrapper.
 *
 * Runtime behavior is implemented by the Node observability adapter. This file
 * remains for existing imports that target the Node-specific monitoring entry.
 */
export class MonitoringSystem extends NodeObservability {}

export const monitoringSystem = new MonitoringSystem();
