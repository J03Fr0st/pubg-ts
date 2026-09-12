import type { EndpointTarget } from './endpoint-query';

/**
 * Narrow transport seam consumed by endpoint modules.
 *
 * @internal
 */
export interface EndpointTransport {
  /** Performs one authenticated, response-cached PUBG GET for an Endpoint Target. */
  get<T>(target: EndpointTarget): Promise<T>;
}

/** Request seam used only by Matches, which owns Match Telemetry discovery. */
export interface MatchTransport extends EndpointTransport {
  /** Fetches a Match Telemetry asset by its external URL, without PUBG credentials or caching. */
  fetchTelemetry<T>(url: string): Promise<T>;
}
