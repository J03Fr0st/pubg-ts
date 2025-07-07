import type { MatchesResponse, SamplesQuery } from '../../types';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

/**
 * Service for interacting with the Samples endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving a sample of match data.
 * It is accessible via the `pubg.samples` property.
 */
export class SamplesService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  /**
   * Get a sample of matches, with optional filtering by creation date.
   *
   * @param query - The query parameters to filter samples by creation date.
   * @returns A promise that resolves with the sample match data.
   * @example
   * ```ts
   * const samples = await pubg.samples.getSamples({
   *  createdAt: {
   *    start: '2022-01-01T00:00:00Z',
   *  },
   * });
   * ```
   */
  async getSamples(query: SamplesQuery = {}): Promise<MatchesResponse> {
    const params = new URLSearchParams();

    if (query.createdAt?.start) {
      params.append('filter[createdAt-start]', query.createdAt.start);
    }

    if (query.createdAt?.end) {
      params.append('filter[createdAt-end]', query.createdAt.end);
    }

    const queryString = params.toString();
    const url = `/shards/${this.shard}/samples${queryString ? `?${queryString}` : ''}`;

    return this.httpClient.get<MatchesResponse>(url);
  }
}
