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
  victimGameResult: TelemetryGameResult;
}

export interface DamageInfo {
  damageReason: string;
  damageTypeCategory: string;
  damageCauserName: string;
  additionalInfo: string[];
  distance: number;
}

export interface LogPlayerKillV2 extends TelemetryEvent {
  _T: 'LogPlayerKillV2';
  attackId: number;
  dBNOMaker?: TelemetryPlayer;
  killer: TelemetryPlayer;
  victim: TelemetryPlayer;
  finisher?: TelemetryPlayer;
  assists: TelemetryPlayer[];
  teamKillers: TelemetryPlayer[];
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
  killerDamageInfo: DamageInfo[];
}

export interface LogPlayerMakeGroggy extends TelemetryEvent {
  _T: 'LogPlayerMakeGroggy';
  attackId: number;
  attacker: TelemetryPlayer;
  victim: TelemetryPlayer;
  damageTypeCategory: string;
  damageReason: string;
  damageCauserName: string;
  damageCauserAdditionalInfo: string[];
  victimWeapon: string;
  victimWeaponAdditionalInfo: string[];
  distance: number;
  isAttackerInVehicle: boolean;
  dBNOId: number;
  groggyDamage: DamageInfo[];
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
  damageCauserAdditionalInfo: string[];
  victimWeapon: string;
  victimWeaponAdditionalInfo: string[];
  distance: number;
  isAttackerInVehicle: boolean;
}

export interface LogPlayerAttack extends TelemetryEvent {
  _T: 'LogPlayerAttack';
  attackId: number;
  fireWeaponStackCount: number;
  attacker: TelemetryPlayer;
  attackType: string;
  weapon: TelemetryItem;
  vehicle?: TelemetryVehicle;
}

export interface LogItemPickup extends TelemetryEvent {
  _T: 'LogItemPickup';
  character: TelemetryPlayer;
  item: TelemetryItem;
}

export interface LogItemDrop extends TelemetryEvent {
  _T: 'LogItemDrop';
  character: TelemetryPlayer;
  item: TelemetryItem;
}

export interface LogItemEquip extends TelemetryEvent {
  _T: 'LogItemEquip';
  character: TelemetryPlayer;
  item: TelemetryItem;
}

export interface LogItemUnequip extends TelemetryEvent {
  _T: 'LogItemUnequip';
  character: TelemetryPlayer;
  item: TelemetryItem;
}

export interface LogVehicleRide extends TelemetryEvent {
  _T: 'LogVehicleRide';
  character: TelemetryPlayer;
  vehicle: TelemetryVehicle;
  seatIndex: number;
}

export interface LogVehicleLeave extends TelemetryEvent {
  _T: 'LogVehicleLeave';
  character: TelemetryPlayer;
  vehicle: TelemetryVehicle;
  rideDistance: number;
  seatIndex: number;
  maxSpeed: number;
}

export interface LogVehicleDestroy extends TelemetryEvent {
  _T: 'LogVehicleDestroy';
  attackId: number;
  attacker: TelemetryPlayer;
  vehicle: TelemetryVehicle;
  damageTypeCategory: string;
  damageCauserName: string;
  distance: number;
}

export interface LogSwimStart extends TelemetryEvent {
  _T: 'LogSwimStart';
  character: TelemetryPlayer;
}

export interface LogSwimEnd extends TelemetryEvent {
  _T: 'LogSwimEnd';
  character: TelemetryPlayer;
  swimDistance: number;
  maxSwimDepthOfWater: number;
}

export interface LogArmorDestroy extends TelemetryEvent {
  _T: 'LogArmorDestroy';
  attackId: number;
  attacker: TelemetryPlayer;
  victim: TelemetryPlayer;
  damageTypeCategory: string;
  damageReason: string;
  damageCauserName: string;
  item: TelemetryItem;
  distance: number;
}

export interface LogParachuteLanding extends TelemetryEvent {
  _T: 'LogParachuteLanding';
  character: TelemetryPlayer;
  distance: number;
}

export interface LogPlayerRevive extends TelemetryEvent {
  _T: 'LogPlayerRevive';
  reviver: TelemetryPlayer;
  victim: TelemetryPlayer;
}

export interface LogHeal extends TelemetryEvent {
  _T: 'LogHeal';
  character: TelemetryPlayer;
  item: TelemetryItem;
  healAmount: number;
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

export interface TelemetryItem {
  itemId: string;
  stackCount: number;
  category: string;
  subCategory: string;
  attachedItems?: string[];
}

export interface TelemetryVehicle {
  vehicleType: string;
  vehicleId: string;
  healthPercent: number;
  feulPercent: number;
  location: TelemetryLocation;
  rotation: TelemetryLocation;
  velocity: TelemetryLocation;
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
  | LogPlayerKillV2
  | LogPlayerMakeGroggy
  | LogPlayerPosition
  | LogPlayerTakeDamage
  | LogPlayerAttack
  | LogItemPickup
  | LogItemDrop
  | LogItemEquip
  | LogItemUnequip
  | LogVehicleRide
  | LogVehicleLeave
  | LogVehicleDestroy
  | LogSwimStart
  | LogSwimEnd
  | LogArmorDestroy
  | LogParachuteLanding
  | LogPlayerRevive
  | LogHeal
  | LogMatchStart
  | LogMatchEnd
  | TelemetryEvent
>;
