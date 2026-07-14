import { PubgNotFoundError, PubgValidationError } from '../../errors';
import type { Asset, MatchesResponse, MatchQuery, MatchResponse, TelemetryData } from '../../types';
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
export class Matches {
  constructor(
    private readonly transport: EndpointTransport,
    private readonly shard: Shard
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
    return this.transport.get<MatchResponse>(url);
  }

  /**
   * Get the telemetry data for a match.
   *
   * @param matchId - The ID of the match whose telemetry to retrieve.
   * @returns A promise that resolves with the match telemetry events.
   * @throws {@link PubgNotFoundError} When the match has no telemetry asset.
   * @throws {@link PubgValidationError} When the match has multiple or invalid telemetry assets.
   * @example
   * ```ts
   * const telemetry = await pubg.matches.getTelemetry(
   *   '01234567-89ab-cdef-0123-456789abcdef'
   * );
   * ```
   */
  async getTelemetry(matchId: string): Promise<TelemetryData> {
    const match = await this.getMatch(matchId);
    const telemetryUrl = this.getTelemetryUrl(matchId, match);
    return this.transport.fetchTelemetry<TelemetryData>(telemetryUrl);
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

    return this.transport.get<MatchesResponse>(
      appendQuery(shardPath(this.shard, '/matches'), params)
    );
  }

  private getTelemetryUrl(matchId: string, match: MatchResponse): string {
    const candidates = (match.included ?? []).filter(
      (entry): entry is Asset => entry.type === 'asset' && entry.attributes?.name === 'telemetry'
    );

    if (candidates.length === 0) {
      throw new PubgNotFoundError(`No telemetry asset found for match ${matchId}`);
    }

    if (candidates.length !== 1) {
      throw new PubgValidationError(`Expected one telemetry asset for match ${matchId}`);
    }

    const url = candidates[0].attributes?.URL;
    if (typeof url !== 'string') {
      throw new PubgValidationError(`Invalid telemetry asset URL for match ${matchId}`);
    }

    let protocol: string;
    try {
      protocol = new URL(url).protocol;
    } catch {
      throw new PubgValidationError(`Invalid telemetry asset URL for match ${matchId}`);
    }

    if (protocol !== 'https:') {
      throw new PubgValidationError(`Invalid telemetry asset URL for match ${matchId}`);
    }

    return url;
  }
}
