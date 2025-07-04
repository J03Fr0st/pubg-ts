import type { TelemetryData } from '../../types';
import type { HttpClient } from '../http-client';

export class TelemetryService {
  constructor(private httpClient: HttpClient) {}

  async getTelemetryData(telemetryUrl: string): Promise<TelemetryData> {
    const url = new URL(telemetryUrl);
    const pathname = url.pathname;

    return this.httpClient.get<TelemetryData>(pathname);
  }
}
