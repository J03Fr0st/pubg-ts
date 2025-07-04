import type { LeaderboardQuery, LeaderboardResponse } from '../../types';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

export class LeaderboardsService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

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
