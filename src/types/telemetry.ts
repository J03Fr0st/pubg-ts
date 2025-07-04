export interface TelemetryEvent {
  _D: string;
  _T: string;
  common: TelemetryCommon;
}

export interface TelemetryCommon {
  matchId: string;
  mapName: string;
  isGame: number;
}

export interface LogPlayerKill extends TelemetryEvent {
  _T: 'LogPlayerKill';
  attackId: number;
  killer: TelemetryPlayer;
  victim: TelemetryPlayer;
  assistant?: TelemetryPlayer;
  dBNOId: number;
  damageTypeCategory: string;
  damageReason: string;
  damageCauserName: string;
  damageCauserAdditionalInfo: string[];
  victimWeapon: string;
  victimWeaponAdditionalInfo: string[];
  distance: number;
  isSuicide: boolean;
  isTeamKill: boolean;
}

export interface LogPlayerPosition extends TelemetryEvent {
  _T: 'LogPlayerPosition';
  character: TelemetryPlayer;
  elapsedTime: number;
  numAlivePlayers: number;
  isGame: number;
}

export interface LogPlayerTakeDamage extends TelemetryEvent {
  _T: 'LogPlayerTakeDamage';
  attackId: number;
  attacker: TelemetryPlayer;
  victim: TelemetryPlayer;
  damageTypeCategory: string;
  damageReason: string;
  damage: number;
  damageCauserName: string;
}

export interface LogMatchStart extends TelemetryEvent {
  _T: 'LogMatchStart';
  characters: TelemetryPlayer[];
  cameraViewBehaviour: string;
  teamSize: number;
  isCustomGame: boolean;
  isEventMode: boolean;
  blueZoneCustomOptions: string;
  gameMode: string;
  mapName: string;
  weatherId: string;
  seasonState: string;
}

export interface LogMatchEnd extends TelemetryEvent {
  _T: 'LogMatchEnd';
  characters: TelemetryPlayer[];
  gameResultOnFinished: TelemetryGameResult;
}

export interface TelemetryPlayer {
  name: string;
  teamId: number;
  health: number;
  location: TelemetryLocation;
  ranking: number;
  accountId: string;
  isInBlueZone: boolean;
  isInRedZone: boolean;
  zone: string[];
}

export interface TelemetryLocation {
  x: number;
  y: number;
  z: number;
}

export interface TelemetryGameResult {
  rank: number;
  gameResult: string;
  teamId: number;
  stats: TelemetryGameStats;
  accountId: string;
}

export interface TelemetryGameStats {
  killCount: number;
  distanceOnFoot: number;
  distanceOnSwim: number;
  distanceOnVehicle: number;
  distanceOnParachute: number;
  distanceOnFreefall: number;
  safeTraveled: number;
  teamKillCount: number;
  timeSurvived: number;
  respawnCount: number;
}

export type TelemetryData = Array<
  | LogPlayerKill
  | LogPlayerPosition
  | LogPlayerTakeDamage
  | LogMatchStart
  | LogMatchEnd
  | TelemetryEvent
>;
