import type {
  PlayerQuery,
  PlayerSeasonStatsResponse,
  PlayersResponse,
  SeasonStatsQuery,
} from '../../types';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

export class PlayersService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  async getPlayers(query: PlayerQuery): Promise<PlayersResponse> {
    const params = new URLSearchParams();

    if (query.playerNames) {
      params.append('filter[playerNames]', query.playerNames.join(','));
    }

    if (query.playerIds) {
      params.append('filter[playerIds]', query.playerIds.join(','));
    }

    const queryString = params.toString();
    const url = `/shards/${this.shard}/players${queryString ? `?${queryString}` : ''}`;

    return this.httpClient.get<PlayersResponse>(url);
  }

  async getPlayerById(playerId: string): Promise<PlayersResponse> {
    return this.getPlayers({ playerIds: [playerId] });
  }

  async getPlayerByName(playerName: string): Promise<PlayersResponse> {
    return this.getPlayers({ playerNames: [playerName] });
  }

  async getPlayerSeasonStats(query: SeasonStatsQuery): Promise<PlayerSeasonStatsResponse> {
    const url = `/shards/${this.shard}/players/${query.playerId}/seasons/${query.seasonId}`;
    const params = query.gameMode ? `?filter[gameMode]=${query.gameMode}` : '';

    return this.httpClient.get<PlayerSeasonStatsResponse>(`${url}${params}`);
  }

  async getPlayerLifetimeStats(playerId: string): Promise<PlayerSeasonStatsResponse> {
    const url = `/shards/${this.shard}/players/${playerId}/seasons/lifetime`;

    return this.httpClient.get<PlayerSeasonStatsResponse>(url);
  }
}
