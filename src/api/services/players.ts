import type {
  PlayerLifetimeStatsBatchQuery,
  PlayerQuery,
  PlayerSeasonStatsBatchQuery,
  PlayerSeasonStatsResponse,
  PlayersResponse,
  SeasonStatsQuery,
} from '../../types';
import type { Shard } from '../../types/common';
import { appendArrayFilter, appendQuery, shardPath } from '../endpoint-query';
import type { HttpClient } from '../http-client';

const MAX_PLAYER_STATS_BATCH_SIZE = 10;

const assertValidPlayerIdBatch = (playerIds: string[]): void => {
  if (playerIds.length === 0 || playerIds.length > MAX_PLAYER_STATS_BATCH_SIZE) {
    throw new RangeError(
      `playerIds must contain between 1 and ${MAX_PLAYER_STATS_BATCH_SIZE} player IDs`
    );
  }
};

/**
 * Service for interacting with the Players endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving player data, including season and lifetime stats.
 * It is accessible via the `pubg.players` property.
 */
export class PlayersService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  /**
   * Get a list of players by their names or IDs.
   *
   * @param query - The query parameters to filter players.
   * @returns A promise that resolves with the player data.
   * @example
   * ```ts
   * const players = await pubg.players.getPlayers({
   *   playerNames: ['shroud', 'DrDisRespect'],
   * });
   * ```
   */
  async getPlayers(query: PlayerQuery): Promise<PlayersResponse> {
    const params = new URLSearchParams();

    appendArrayFilter(params, 'filter[playerNames]', query.playerNames);
    appendArrayFilter(params, 'filter[playerIds]', query.playerIds);

    return this.httpClient.get<PlayersResponse>(
      appendQuery(shardPath(this.shard, '/players'), params)
    );
  }

  /**
   * Get a single player by their ID.
   *
   * @param playerId - The ID of the player to retrieve.
   * @returns A promise that resolves with the player data.
   * @example
   * ```ts
   * const player = await pubg.players.getPlayerById('account.0000a000000000000000000000000000');
   * ```
   */
  async getPlayerById(playerId: string): Promise<PlayersResponse> {
    return this.getPlayers({ playerIds: [playerId] });
  }

  /**
   * Get a single player by their name.
   *
   * @param playerName - The name of the player to retrieve.
   * @returns A promise that resolves with the player data.
   * @example
   * ```ts
   * const player = await pubg.players.getPlayerByName('shroud');
   * ```
   */
  async getPlayerByName(playerName: string): Promise<PlayersResponse> {
    return this.getPlayers({ playerNames: [playerName] });
  }

  /**
   * Get the season stats for a single player.
   *
   * @param query - The query parameters to specify the player and season.
   * @returns A promise that resolves with the player's season stats.
   * @example
   * ```ts
   * const seasonStats = await pubg.players.getPlayerSeasonStats({
   *   playerId: 'account.0000a000000000000000000000000000',
   *   seasonId: 'division.bro.official.pc-2018-01',
   * });
   * ```
   */
  async getPlayerSeasonStats(query: SeasonStatsQuery): Promise<PlayerSeasonStatsResponse> {
    const url = shardPath(this.shard, `/players/${query.playerId}/seasons/${query.seasonId}`);
    const params = query.gameMode ? `?filter[gameMode]=${query.gameMode}` : '';

    return this.httpClient.get<PlayerSeasonStatsResponse>(`${url}${params}`);
  }

  /**
   * Get season stats for a single game mode for up to 10 players.
   *
   * @param query - The season, game mode, and player IDs to retrieve stats for.
   * @returns A promise that resolves with the players' season stats.
   * @example
   * ```ts
   * const seasonStats = await pubg.players.getPlayerSeasonStatsBatch({
   *   seasonId: 'division.bro.official.pc-2018-01',
   *   gameMode: 'squad-fpp',
   *   playerIds: ['account.0000a000000000000000000000000000'],
   * });
   * ```
   */
  async getPlayerSeasonStatsBatch(
    query: PlayerSeasonStatsBatchQuery
  ): Promise<PlayerSeasonStatsResponse> {
    assertValidPlayerIdBatch(query.playerIds);

    const params = new URLSearchParams();
    appendArrayFilter(params, 'filter[playerIds]', query.playerIds);

    return this.httpClient.get<PlayerSeasonStatsResponse>(
      appendQuery(
        shardPath(this.shard, `/seasons/${query.seasonId}/gameMode/${query.gameMode}/players`),
        params
      )
    );
  }

  /**
   * Get the lifetime stats for a single player.
   *
   * @param playerId - The ID of the player to retrieve lifetime stats for.
   * @returns A promise that resolves with the player's lifetime stats.
   * @example
   * ```ts
   * const lifetimeStats = await pubg.players.getPlayerLifetimeStats('account.0000a000000000000000000000000000');
   * ```
   */
  async getPlayerLifetimeStats(playerId: string): Promise<PlayerSeasonStatsResponse> {
    const url = shardPath(this.shard, `/players/${playerId}/seasons/lifetime`);

    return this.httpClient.get<PlayerSeasonStatsResponse>(url);
  }

  /**
   * Get lifetime stats for a single game mode for up to 10 players.
   *
   * @param query - The game mode and player IDs to retrieve lifetime stats for.
   * @returns A promise that resolves with the players' lifetime stats.
   * @example
   * ```ts
   * const lifetimeStats = await pubg.players.getPlayerLifetimeStatsBatch({
   *   gameMode: 'squad-fpp',
   *   playerIds: ['account.0000a000000000000000000000000000'],
   * });
   * ```
   */
  async getPlayerLifetimeStatsBatch(
    query: PlayerLifetimeStatsBatchQuery
  ): Promise<PlayerSeasonStatsResponse> {
    assertValidPlayerIdBatch(query.playerIds);

    const params = new URLSearchParams();
    appendArrayFilter(params, 'filter[playerIds]', query.playerIds);

    return this.httpClient.get<PlayerSeasonStatsResponse>(
      appendQuery(
        shardPath(this.shard, `/seasons/lifetime/gameMode/${query.gameMode}/players`),
        params
      )
    );
  }
}
