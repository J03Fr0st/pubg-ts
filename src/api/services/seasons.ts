import type { SeasonsResponse } from '../../types';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

/**
 * Service for interacting with the Seasons endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving season data.
 * It is accessible via the `pubg.seasons` property.
 */
export class SeasonsService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
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
    const url = `/shards/${this.shard}/seasons`;
    return this.httpClient.get<SeasonsResponse>(url);
  }

  /**
   * Get the current season.
   *
   * @returns A promise that resolves with the current season data.
   * @example
   * ```ts
   * const currentSeason = await pubg.seasons.getCurrentSeason();
   * ```
   */
  async getCurrentSeason(): Promise<SeasonsResponse> {
    const seasons = await this.getSeasons();
    const currentSeason = seasons.data.find((season) => season.attributes.isCurrentSeason);

    if (!currentSeason) {
      throw new Error('No current season found');
    }

    return {
      data: [currentSeason],
      links: seasons.links,
      meta: seasons.meta,
    };
  }
}
