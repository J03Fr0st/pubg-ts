import { HttpClient } from '../http-client';
import { TelemetryData } from '../../types';

export class TelemetryService {
  constructor(private httpClient: HttpClient) {}

  async getTelemetryData(telemetryUrl: string): Promise<TelemetryData> {
    const url = new URL(telemetryUrl);
    const pathname = url.pathname;
    
    return this.httpClient.get<TelemetryData>(pathname);
  }
}