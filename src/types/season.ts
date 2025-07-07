import type { ApiResponse, ResourceComplete } from './common';

export interface SeasonAttributes {
  isCurrentSeason: boolean;
  isOffseason: boolean;
}

export interface Season extends ResourceComplete<SeasonAttributes, Record<string, never>> {
  type: 'season';
}

export type SeasonsResponse = ApiResponse<Season>;
