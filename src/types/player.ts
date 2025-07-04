import type { ApiResponse, GameMode, ResourceComplete, Shard } from './common';

export interface PlayerAttributes {
  createdAt: string;
  name: string;
  patchVersion: string;
  shardId: Shard;
  stats: any | null;
  titleId: string;
  updatedAt: string;
}

export interface PlayerRelationships {
  assets: {
    data: any[];
  };
  matches: {
    data: Array<{
      type: 'match';
      id: string;
    }>;
  };
}

export interface Player extends ResourceComplete<PlayerAttributes, PlayerRelationships> {
  type: 'player';
}

export interface PlayerSeasonStats {
  type: 'playerSeason';
  id: string;
  attributes: {
    bestRankPoint: number;
    gameModeStats: {
      [key in GameMode]?: GameModeStats;
    };
  };
  relationships: {
    matchesSolo?: { data: MatchReference[] };
    matchesDuo?: { data: MatchReference[] };
    matchesSquad?: { data: MatchReference[] };
    matchesSoloFPP?: { data: MatchReference[] };
    matchesDuoFPP?: { data: MatchReference[] };
    matchesSquadFPP?: { data: MatchReference[] };
    player: { data: { type: 'player'; id: string } };
    season: { data: { type: 'season'; id: string } };
  };
}

export interface GameModeStats {
  assists: number;
  boosts: number;
  dBNOs: number;
  dailyKills: number;
  damageDealt: number;
  days: number;
  dailyWins: number;
  headshotKills: number;
  heals: number;
  killPoints: number;
  kills: number;
  longestKill: number;
  longestTimeSurvived: number;
  losses: number;
  maxKillStreaks: number;
  mostSurvivalTime: number;
  rankPoints: number;
  rankPointsTitle: string;
  revives: number;
  rideDistance: number;
  roadKills: number;
  roundMostKills: number;
  roundsPlayed: number;
  suicides: number;
  swimDistance: number;
  teamKills: number;
  timeSurvived: number;
  top10s: number;
  vehicleDestroys: number;
  walkDistance: number;
  weaponsAcquired: number;
  weeklyKills: number;
  weeklyWins: number;
  winPoints: number;
  wins: number;
}

export interface MatchReference {
  type: 'match';
  id: string;
}

export type PlayersResponse = ApiResponse<Player>;
export type PlayerSeasonStatsResponse = ApiResponse<PlayerSeasonStats>;
