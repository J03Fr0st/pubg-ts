import type { PubgClientConfig } from '../types/api';
import { AssetManager } from '../utils/assets';
import type { ClientHealth } from './client-health';
import { ClientRuntime } from './client-runtime';
import { LeaderboardsService } from './services/leaderboards';
import { MatchesService } from './services/matches';
import { PlayersService } from './services/players';
import { SamplesService } from './services/samples';
import { SeasonsService } from './services/seasons';
import { TelemetryService } from './services/telemetry';

export class PubgClient {
  private runtime: ClientRuntime;

  public readonly players: PlayersService;
  public readonly matches: MatchesService;
  public readonly seasons: SeasonsService;
  public readonly leaderboards: LeaderboardsService;
  public readonly samples: SamplesService;
  public readonly telemetry: TelemetryService;
  public readonly assets: AssetManager;

  constructor(config: PubgClientConfig) {
    this.runtime = new ClientRuntime(config);

    this.players = new PlayersService(this.runtime, config.shard);
    this.matches = new MatchesService(this.runtime, config.shard);
    this.seasons = new SeasonsService(this.runtime, config.shard);
    this.leaderboards = new LeaderboardsService(this.runtime, config.shard);
    this.samples = new SamplesService(this.runtime, config.shard);
    this.telemetry = new TelemetryService(this.runtime);
    this.assets = new AssetManager();
  }

  /** Returns a synchronous, redacted snapshot of this client's request health. */
  getHealth(): ClientHealth {
    return this.runtime.getHealth();
  }

  /** Clears only this client's cached API responses. */
  clearResponseCache(): void {
    this.runtime.clearResponseCache();
  }
}
