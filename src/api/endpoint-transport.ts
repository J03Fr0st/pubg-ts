import type { AxiosRequestConfig } from 'axios';

/** Internal request configuration with response-cache control. */
export type CacheRequestConfig = AxiosRequestConfig & { useCache?: boolean };

/**
 * Narrow transport seam consumed by endpoint services.
 *
 * @internal
 */
export interface EndpointTransport {
  get<T>(url: string, config?: CacheRequestConfig): Promise<T>;
  fetchTelemetry<T>(url: string): Promise<T>;
}
