import { HttpClient } from '../http-client';
import { 
  MatchResponse, 
  MatchesResponse, 
  MatchQuery 
} from '../../types';
import { Shard } from '../../types/common';

export class MatchesService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  async getMatch(matchId: string): Promise<MatchResponse> {
    const url = `/shards/${this.shard}/matches/${matchId}`;
    return this.httpClient.get<MatchResponse>(url);
  }

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