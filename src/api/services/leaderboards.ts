import type { LeaderboardQuery } from '../../types/api';
import type { LeaderboardResponse } from '../../types/leaderboard';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

/**
 * Service for interacting with the Leaderboards endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving leaderboard data.
 * It is accessible via the `pubg.leaderboards` property.
 */
export class LeaderboardsService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  /**
   * Get the leaderboard for a specific season and game mode.
   *
   * @param query - The query parameters to specify the season, game mode, and pagination.
   * @returns A promise that resolves with the leaderboard data.
   * @example
   * ```ts
   * const leaderboard = await pubg.leaderboards.getLeaderboard({
   *  seasonId: 'division.bro.official.pc-2018-01',
   *  gameMode: 'squad-fpp',
   * });
   * ```
   */
  async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardResponse> {
    const params = new URLSearchParams();

    if (query.pageSize) {
      params.append('page[limit]', query.pageSize.toString());
    }

    if (query.offset) {
      params.append('page[offset]', query.offset.toString());
    }

    const queryString = params.toString();
    const url = `/shards/${this.shard}/leaderboards/${query.seasonId}/${query.gameMode}${queryString ? `?${queryString}` : ''}`;

    return this.httpClient.get<LeaderboardResponse>(url);
  }
}
