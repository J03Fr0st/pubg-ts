import { PubgNotFoundError } from '../../errors';
import type { SeasonsResponse } from '../../types';
import type { Shard } from '../../types/common';
import { endpointTarget } from '../endpoint-query';
import type { EndpointTransport } from '../endpoint-transport';

/**
 * Service for interacting with the Seasons endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving season data.
 * It is accessible via the `pubg.seasons` property.
 */
export class Seasons {
  constructor(
    private readonly transport: EndpointTransport,
    private readonly shard: Shard
  ) {}

  /**
   * Get a list of all available seasons.
   *
   * @returns A promise that resolves with the season data.
   * @example
   * ```ts
   * const seasons = await pubg.seasons.getSeasons();
   * ```
   */
  async getSeasons(): Promise<SeasonsResponse> {
    return this.transport.get<SeasonsResponse>(endpointTarget(this.shard, ['seasons']));
  }

  /**
   * Get the season PUBG currently flags as the current one for this shard.
   *
   * @returns A promise that resolves with the current season data.
   * @throws {@link PubgNotFoundError} When PUBG reports no current season for the shard.
   * @example
   * ```ts
   * const currentSeason = await pubg.seasons.getCurrentSeason();
   * ```
   */
  async getCurrentSeason(): Promise<SeasonsResponse> {
    const seasons = await this.getSeasons();
    const currentSeason = seasons.data.find((season) => season.attributes.isCurrentSeason);

    if (!currentSeason) {
      throw new PubgNotFoundError('No current season found', {
        operation: 'current_season_lookup',
        metadata: { shard: this.shard },
      });
    }

    return {
      data: [currentSeason],
      links: seasons.links,
      meta: seasons.meta,
    };
  }
}
