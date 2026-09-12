// Generated from src/assets by scripts/generate-asset-types.js. Do not edit by hand.

export interface SeasonAttributes {
  startDate: string;
  endDate: string;
}

export interface SeasonData {
  id: string;
  attributes: SeasonAttributes;
}

export interface SeasonsData {
  [platform: string]: SeasonData[];
}

export type Platform = 'PC' | 'XBOX' | 'PS4' | 'Stadia';
