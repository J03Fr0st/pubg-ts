import { HttpClient } from '../http-client';
import { SeasonsResponse } from '../../types';
import { Shard } from '../../types/common';

export class SeasonsService {
  constructor(
    private httpClient: HttpClient,
    private shard: Shard
  ) {}

  async getSeasons(): Promise<SeasonsResponse> {
    const url = `/shards/${this.shard}/seasons`;
    return this.httpClient.get<SeasonsResponse>(url);
  }

  async getCurrentSeason(): Promise<SeasonsResponse> {
    const seasons = await this.getSeasons();
    const currentSeason = seasons.data.find(season => season.attributes.isCurrentSeason);
    
    if (!currentSeason) {
      throw new Error('No current season found');
    }
    
    return {
      data: [currentSeason],
      links: seasons.links,
      meta: seasons.meta
    };
  }
}