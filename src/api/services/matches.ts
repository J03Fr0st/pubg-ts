import type { MatchesResponse, MatchQuery, MatchResponse } from '../../types';
import type { Shard } from '../../types/common';
import {
  appendArrayFilter,
  appendPageParams,
  appendQuery,
  appendValue,
  shardPath,
} from '../endpoint-query';
import type { EndpointTransport } from '../endpoint-transport';

/**
 * Service for interacting with the Matches endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving match data.
 * It is accessible via the `pubg.matches` property.
 */
export class MatchesService {
  constructor(
    private httpClient: EndpointTransport,
    private shard: Shard
  ) {}

  /**
   * Get a single match by its ID.
   *
   * @param matchId - The ID of the match to retrieve.
   * @returns A promise that resolves with the match data.
   * @example
   * ```ts
   * const match = await pubg.matches.getMatch('01234567-89ab-cdef-0123-456789abcdef');
   * ```
   */
  async getMatch(matchId: string): Promise<MatchResponse> {
    const url = shardPath(this.shard, `/matches/${matchId}`);
    return this.httpClient.get<MatchResponse>(url);
  }

  /**
   * Get a list of matches, with optional filtering and pagination.
   *
   * @param query - The query parameters to filter and paginate matches.
   * @returns A promise that resolves with the match data.
   * @example
   * ```ts
   * const matches = await pubg.matches.getMatches({
   *  filter: {
   *    playerIds: ['account.0000a000000000000000000000000000'],
   *    gameMode: ['squad-fpp'],
   *  },
   *  pageSize: 5,
   * });
   * ```
   */
  async getMatches(query: MatchQuery = {}): Promise<MatchesResponse> {
    const params = new URLSearchParams();

    appendPageParams(params, query);
    appendValue(params, 'sort', query.sort);

    if (query.filter) {
      appendValue(params, 'filter[createdAt-start]', query.filter.createdAt?.start);
      appendValue(params, 'filter[createdAt-end]', query.filter.createdAt?.end);
      appendArrayFilter(params, 'filter[playerIds]', query.filter.playerIds);
      appendArrayFilter(params, 'filter[gameMode]', query.filter.gameMode);
    }

    return this.httpClient.get<MatchesResponse>(
      appendQuery(shardPath(this.shard, '/matches'), params)
    );
  }
}
