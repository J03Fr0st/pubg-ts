import type { MatchesResponse, SamplesQuery } from '../../types';
import type { Shard } from '../../types/common';
import type { HttpClient } from '../http-client';

export class SamplesService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  async getSamples(query: SamplesQuery = {}): Promise<MatchesResponse> {
    const params = new URLSearchParams();

    if (query.createdAt?.start) {
      params.append('filter[createdAt-start]', query.createdAt.start);
    }

    if (query.createdAt?.end) {
      params.append('filter[createdAt-end]', query.createdAt.end);
    }

    const queryString = params.toString();
    const url = `/shards/${this.shard}/samples${queryString ? `?${queryString}` : ''}`;

    return this.httpClient.get<MatchesResponse>(url);
  }
}
