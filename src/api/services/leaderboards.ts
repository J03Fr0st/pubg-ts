import type { LeaderboardQuery } from '../../types/api';
import type { Shard } from '../../types/common';
import type { LeaderboardResponse } from '../../types/leaderboard';
import { appendPageParams, appendQuery, shardPath } from '../endpoint-query';
import type { EndpointTransport } from '../endpoint-transport';

/**
 * Service for interacting with the Leaderboards endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving leaderboard data.
 * It is accessible via the `pubg.leaderboards` property.
 */
export class LeaderboardsService {
  constructor(
    private httpClient: EndpointTransport,
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

    appendPageParams(params, query);

    const url = appendQuery(
      shardPath(this.shard, `/leaderboards/${query.seasonId}/${query.gameMode}`),
      params
    );

    return this.httpClient.get<LeaderboardResponse>(url);
  }
}
