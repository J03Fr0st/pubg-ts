import type { MatchesResponse, MatchQuery, MatchResponse } from '../../types';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

/**
 * Service for interacting with the Matches endpoint of the PUBG API.
 *
 * @remarks
 * This service provides methods for retrieving match data.
 * It is accessible via the `pubg.matches` property.
 */
export class MatchesService {
  constructor(
    private httpClient: HttpClient,
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
    const url = `/shards/${this.shard}/matches/${matchId}`;
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

    if (query.pageSize) {
      params.append('page[limit]', query.pageSize.toString());
    }

    if (query.offset) {
      params.append('page[offset]', query.offset.toString());
    }

    if (query.sort) {
      params.append('sort', query.sort);
    }

    if (query.filter) {
      if (query.filter.createdAt?.start) {
        params.append('filter[createdAt-start]', query.filter.createdAt.start);
      }

      if (query.filter.createdAt?.end) {
        params.append('filter[createdAt-end]', query.filter.createdAt.end);
      }

      if (query.filter.playerIds) {
        params.append('filter[playerIds]', query.filter.playerIds.join(','));
      }

      if (query.filter.gameMode) {
        params.append('filter[gameMode]', query.filter.gameMode.join(','));
      }
    }

    const queryString = params.toString();
    const url = `/shards/${this.shard}/matches${queryString ? `?${queryString}` : ''}`;

    return this.httpClient.get<MatchesResponse>(url);
  }
}
