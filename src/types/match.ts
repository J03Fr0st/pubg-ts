import type {
  ApiResponse,
  GameMode,
  MapName,
  ResourceComplete,
  Shard,
  SingleApiResponse,
} from './common';

export interface MatchAttributes {
  createdAt: string;
  duration: number;
  gameMode: GameMode;
  mapName: MapName;
  isCustomMatch: boolean;
  patchVersion: string;
  seasonState: string;
  shardId: Shard;
  stats: any | null;
  tags: any | null;
  titleId: string;
  matchType: string;
}

export interface MatchRelationships {
  assets: {
    data: Array<{
      type: 'asset';
      id: string;
    }>;
  };
  rosters: {
    data: Array<{
      type: 'roster';
      id: string;
    }>;
  };
  rounds: {
    data: Array<{
      type: 'round';
      id: string;
    }>;
  };
}

export interface Match extends ResourceComplete<MatchAttributes, MatchRelationships> {
  type: 'match';
}

export interface RosterAttributes {
  shardId: Shard;
  stats: RosterStats;
  won: string;
}

export interface RosterStats {
  rank: number;
  teamId: number;
}

export interface RosterRelationships {
  participants: {
    data: Array<{
      type: 'participant';
      id: string;
    }>;
  };
  team: {
    data: {
      type: 'team';
      id: string;
    } | null;
  };
}

export interface Roster extends ResourceComplete<RosterAttributes, RosterRelationships> {
  type: 'roster';
}

export interface ParticipantAttributes {
  actor: string;
  shardId: Shard;
  stats: ParticipantStats;
}

export interface ParticipantStats {
  DBNOs: number;
  assists: number;
  boosts: number;
  damageDealt: number;
  deathType: string;
  headshotKills: number;
  heals: number;
  killPlace: number;
  killPoints: number;
  killPointsDelta: number;
  killStreaks: number;
  kills: number;
  lastKillPoints: number;
  lastWinPoints: number;
  longestKill: number;
  mostDamage: number;
  name: string;
  playerId: string;
  rankPoints: number;
  revives: number;
  rideDistance: number;
  roadKills: number;
  swimDistance: number;
  teamKills: number;
  timeSurvived: number;
  vehicleDestroys: number;
  walkDistance: number;
  weaponsAcquired: number;
  winPlace: number;
  winPoints: number;
  winPointsDelta: number;
}

export interface ParticipantRelationships {
  matches: {
    data: Array<{
      type: 'match';
      id: string;
    }>;
  };
}

export interface Participant
  extends ResourceComplete<ParticipantAttributes, ParticipantRelationships> {
  type: 'participant';
}

export interface AssetAttributes {
  URL: string;
  createdAt: string;
  description: string;
  name: string;
}

export interface Asset extends ResourceComplete<AssetAttributes, Record<string, never>> {
  type: 'asset';
}

export interface MatchResponse extends SingleApiResponse<Match> {
  included: Array<Roster | Participant | Asset>;
}

export type MatchesResponse = ApiResponse<Match>;
