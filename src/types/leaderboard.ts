import type { ApiResponse, GameMode, ResourceComplete } from './common';

export interface LeaderboardAttributes {
  shardId: string;
  gameMode: GameMode;
  rankedStats: LeaderboardStats[];
}

export interface LeaderboardStats {
  playerId: string;
  playerName: string;
  rank: number;
  tier: string;
  subTier: string;
  rankPoints: number;
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  top10s: number;
  kda: number;
  averageDamage: number;
  averageRank: number;
  gamesPlayed: number;
}

export interface LeaderboardRelationships {
  players: {
    data: Array<{
      type: 'player';
      id: string;
    }>;
  };
}

export interface Leaderboard
  extends ResourceComplete<LeaderboardAttributes, LeaderboardRelationships> {
  type: 'leaderboard';
}

export type LeaderboardResponse = ApiResponse<Leaderboard>;
