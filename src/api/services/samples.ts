import type { MatchesResponse, SamplesQuery } from '../../types';
import type { Shard } from '../../types/common';
import { endpointTarget } from '../endpoint-query';
import type { EndpointTransport } from '../endpoint-transport';

/**
 * Service for interacting with the Samples endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving a sample of match data.
 * It is accessible via the `pubg.samples` property.
 */
export class Samples {
  constructor(
    private readonly transport: EndpointTransport,
    private readonly shard: Shard
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
    return this.transport.get<MatchesResponse>(
      endpointTarget(this.shard, ['samples'], {
        'filter[createdAt-start]': query.createdAt?.start,
        'filter[createdAt-end]': query.createdAt?.end,
      })
    );
  }
}
