import type { TelemetryData } from '../../types';
import type { HttpClient } from '../http-client';

/**
 * Service for interacting with the Telemetry endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving telemetry data from a match.
 * It is accessible via the `pubg.telemetry` property.
 */
export class TelemetryService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Get the telemetry data from a specific URL.
   *
   * @param telemetryUrl - The URL of the telemetry data to retrieve.
   * @returns A promise that resolves with the telemetry data.
   * @example
   * ```ts
   * // First, get a match
   * const match = await pubg.matches.getMatch('01234567-89ab-cdef-0123-456789abcdef');
   *
   * // Then, get the telemetry URL from the match data
   * const telemetryAsset = match.included.find(i => i.type === 'asset' && i.attributes.name === 'telemetry');
   * if (telemetryAsset) {
   *   const telemetryUrl = telemetryAsset.attributes.URL;
   *   const telemetryData = await pubg.telemetry.getTelemetryData(telemetryUrl);
   * }
   * ```
   */
  async getTelemetryData(telemetryUrl: string): Promise<TelemetryData> {
    return this.httpClient.getExternal<TelemetryData>(telemetryUrl);
  }
}
