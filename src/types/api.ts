import type { GameMode, Shard } from './common';

export interface PubgClientConfig {
  apiKey: string;
  shard: Shard;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface PubgClientOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface PlayerQuery {
  playerNames?: string[];
  playerIds?: string[];
}

export interface MatchQuery {
  pageSize?: number;
  offset?: number;
  sort?: 'createdAt' | '-createdAt';
  filter?: {
    createdAt?: {
      start?: string;
      end?: string;
    };
    playerIds?: string[];
    gameMode?: GameMode[];
  };
}

export interface SeasonStatsQuery {
  seasonId: string;
  playerId: string;
  gameMode?: GameMode;
}

export interface LeaderboardQuery {
  seasonId: string;
  gameMode: GameMode;
  pageSize?: number;
  offset?: number;
}

export interface SamplesQuery {
  createdAt?: {
    start?: string;
    end?: string;
  };
}
