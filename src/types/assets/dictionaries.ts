// Generated from PUBG API assets
// Last updated: 2025-08-11T14:20:00.000Z

import damageCauserData from '../../assets/dictionaries/damage-causer-name.json';
import gameModeData from '../../assets/dictionaries/game-mode.json';

export interface GameModeDictionary {
  [key: string]: string;
}

export interface DamageCauserDictionary {
  [key: string]: string;
}

// Game Mode Dictionary (equivalent to GAME_MODES)
export const GAME_MODE_DICTIONARY: GameModeDictionary = gameModeData;

// Damage Causer Name Dictionary (equivalent to DAMAGE_CAUSER_NAME)
export const DAMAGE_CAUSER_DICTIONARY: DamageCauserDictionary = damageCauserData;

// Export with your preferred naming convention
export const GAME_MODES = GAME_MODE_DICTIONARY;
export const DAMAGE_CAUSER_NAME = DAMAGE_CAUSER_DICTIONARY;

// Export types
export type GameModeId = keyof GameModeDictionary;
export type GameModeName = GameModeDictionary[GameModeId];
export type DamageCauserId = keyof DamageCauserDictionary;
export type DamageCauserName = DamageCauserDictionary[DamageCauserId];
