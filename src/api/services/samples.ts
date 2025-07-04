import { HttpClient } from '../http-client';
import { 
  MatchesResponse, 
  SamplesQuery 
} from '../../types';
import { Shard } from '../../types/common';

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