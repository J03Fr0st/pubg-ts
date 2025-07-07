import type { PubgClientConfig } from '../types/api';
import { AssetManager } from '../utils/assets';
import { HttpClient } from './http-client';
import { LeaderboardsService } from './services/leaderboards';
import { MatchesService } from './services/matches';
import { PlayersService } from './services/players';
import { SamplesService } from './services/samples';
import { SeasonsService } from './services/seasons';
import { TelemetryService } from './services/telemetry';

export class PubgClient {
  private httpClient: HttpClient;

  public readonly players: PlayersService;
  public readonly matches: MatchesService;
  public readonly seasons: SeasonsService;
  public readonly leaderboards: LeaderboardsService;
  public readonly samples: SamplesService;
  public readonly telemetry: TelemetryService;
  public readonly assets: AssetManager;

  constructor(config: PubgClientConfig) {
    this.httpClient = new HttpClient(config);

    this.players = new PlayersService(this.httpClient, config.shard);
    this.matches = new MatchesService(this.httpClient, config.shard);
    this.seasons = new SeasonsService(this.httpClient, config.shard);
    this.leaderboards = new LeaderboardsService(this.httpClient, config.shard);
    this.samples = new SamplesService(this.httpClient, config.shard);
    this.telemetry = new TelemetryService(this.httpClient);
    this.assets = new AssetManager();
  }

  getRateLimitStatus() {
    return this.httpClient.getRateLimitStatus();
  }

  getCacheStats() {
    return this.httpClient.getCacheStats();
  }

  clearCache() {
    this.httpClient.clearCache();
  }
}
