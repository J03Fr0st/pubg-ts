import type { PubgClientConfig } from '../types/api';
import { AssetManager } from '../utils/assets';
import type { ClientHealth } from './client-health';
import { ClientRuntime } from './client-runtime';
import { Leaderboards } from './services/leaderboards';
import { Matches } from './services/matches';
import { Players } from './services/players';
import { Samples } from './services/samples';
import { Seasons } from './services/seasons';
import { TelemetryService } from './services/telemetry';

export class PubgClient {
  private runtime: ClientRuntime;

  public readonly players: Players;
  public readonly matches: Matches;
  public readonly seasons: Seasons;
  public readonly leaderboards: Leaderboards;
  public readonly samples: Samples;
  public readonly telemetry: TelemetryService;
  public readonly assets: AssetManager;

  constructor(config: PubgClientConfig) {
    this.runtime = new ClientRuntime(config);

    this.players = new Players(this.runtime, config.shard);
    this.matches = new Matches(this.runtime, config.shard);
    this.seasons = new Seasons(this.runtime, config.shard);
    this.leaderboards = new Leaderboards(this.runtime, config.shard);
    this.samples = new Samples(this.runtime, config.shard);
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
