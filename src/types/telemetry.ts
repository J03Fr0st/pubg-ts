export interface TelemetryEvent {
  _D?: string;
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
  isThroughPenetrableWall: boolean;
}

/**
 * DamageInfo can appear as a single object, array of objects, null, or undefined in telemetry data
 */
export type FlexibleDamageInfo = DamageInfo | DamageInfo[] | null | undefined;

/**
 * Utility functions for working with FlexibleDamageInfo
 */
export const DamageInfoUtils = {
  /**
   * Convert FlexibleDamageInfo to an array, handling all possible formats
   */
  toArray(damageInfo: FlexibleDamageInfo): DamageInfo[] {
    if (!damageInfo) return [];
    return Array.isArray(damageInfo) ? damageInfo : [damageInfo];
  },

  /**
   * Get the first damage info item, regardless of format
   */
  getFirst(damageInfo: FlexibleDamageInfo): DamageInfo | null {
    if (!damageInfo) return null;
    return Array.isArray(damageInfo) ? damageInfo[0] || null : damageInfo;
  },

  /**
   * Check if damage info exists and has content
   */
  hasData(damageInfo: FlexibleDamageInfo): boolean {
    if (!damageInfo) return false;
    return Array.isArray(damageInfo) ? damageInfo.length > 0 : true;
  },
};

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
  killerDamageInfo: FlexibleDamageInfo;
  victimVehicle?: TelemetryVehicle;
  killerVehicle?: TelemetryVehicle;
  finishDamageInfo?: FlexibleDamageInfo;
  dBNODamageInfo?: FlexibleDamageInfo;
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
  groggyDamage: FlexibleDamageInfo;
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

/**
 * Item usage event
 */
export interface LogItemUse extends TelemetryEvent {
  _T: 'LogItemUse';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  item?: TelemetryItem;
}

/**
 * Item attachment event
 */
export interface LogItemAttach extends TelemetryEvent {
  _T: 'LogItemAttach';
  _D?: string;
  character?: TelemetryPlayer;
  childItem?: TelemetryItem;
  common: TelemetryCommon;
  parentItem?: TelemetryItem;
}

/**
 * Item detachment event
 */
export interface LogItemDetach extends TelemetryEvent {
  _T: 'LogItemDetach';
  _D?: string;
  character?: TelemetryPlayer;
  childItem?: TelemetryItem;
  common: TelemetryCommon;
  parentItem?: TelemetryItem;
}

/**
 * Object interaction event
 */
export interface LogObjectInteraction extends TelemetryEvent {
  _T: 'LogObjectInteraction';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  objectType?: string;
  objectTypeAdditionalInfo?: any[];
  objectTypeStatus?: string;
}

/**
 * Weapon fire count event
 */
export interface LogWeaponFireCount extends TelemetryEvent {
  _T: 'LogWeaponFireCount';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  fireCount?: number;
  weaponId?: string;
}

/**
 * Vehicle damage event
 */
export interface LogVehicleDamage extends TelemetryEvent {
  _T: 'LogVehicleDamage';
  _D?: string;
  attackId?: number;
  attacker?: TelemetryPlayer;
  common: TelemetryCommon;
  damage?: number;
  damageCauserName?: string;
  damageTypeCategory?: string;
  distance?: number;
  vehicle?: TelemetryVehicle;
}

/**
 * Object destruction event
 */
export interface LogObjectDestroy extends TelemetryEvent {
  _T: 'LogObjectDestroy';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  damageCauserName?: string;
  objectLocation?: TelemetryLocation;
  objectType?: string;
}

/**
 * Item pickup from loot box event
 */
export interface LogItemPickupFromLootBox extends TelemetryEvent {
  _T: 'LogItemPickupFromLootBox';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  creatorAccountId?: string;
  item?: TelemetryItem;
  ownerTeamId?: number;
}

/**
 * Vault/climb action start event
 */
export interface LogVaultStart extends TelemetryEvent {
  _T: 'LogVaultStart';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  isLedgeGrab?: boolean;
  isVaultOnVehicle?: boolean;
}

/**
 * Player throwable usage event
 */
export interface LogPlayerUseThrowable extends TelemetryEvent {
  _T: 'LogPlayerUseThrowable';
  _D?: string;
  attackId?: number;
  attackType?: string;
  attacker?: TelemetryPlayer;
  common: TelemetryCommon;
  fireWeaponStackCount?: number;
  weapon?: TelemetryItem;
}

/**
 * Periodic game state event
 */
export interface LogGameStatePeriodic extends TelemetryEvent {
  _T: 'LogGameStatePeriodic';
  _D?: string;
  common: TelemetryCommon;
  gameState?: any;
}

/**
 * Player creation event
 */
export interface LogPlayerCreate extends TelemetryEvent {
  _T: 'LogPlayerCreate';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
}

/**
 * Player logout event
 */
export interface LogPlayerLogout extends TelemetryEvent {
  _T: 'LogPlayerLogout';
  _D?: string;
  accountId?: string;
  common: TelemetryCommon;
}

/**
 * Player login event
 */
export interface LogPlayerLogin extends TelemetryEvent {
  _T: 'LogPlayerLogin';
  _D?: string;
  accountId?: string;
  common: TelemetryCommon;
}

/**
 * Item pickup from care package event
 */
export interface LogItemPickupFromCarepackage extends TelemetryEvent {
  _T: 'LogItemPickupFromCarepackage';
  _D?: string;
  carePackageName?: string;
  carePackageUniqueId?: number;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  item?: TelemetryItem;
}

/**
 * Vehicle wheel destruction event
 */
export interface LogWheelDestroy extends TelemetryEvent {
  _T: 'LogWheelDestroy';
  _D?: string;
  attackId?: number;
  attacker?: TelemetryPlayer;
  common: TelemetryCommon;
  damageCauserName?: string;
  damageTypeCategory?: string;
  vehicle?: TelemetryVehicle;
  wheelIndex?: number;
}

/**
 * Game phase change event
 */
export interface LogPhaseChange extends TelemetryEvent {
  _T: 'LogPhaseChange';
  _D?: string;
  common: TelemetryCommon;
  phase?: number;
  playersInWhiteCircle?: string[];
}

/**
 * Character carry state event
 */
export interface LogCharacterCarry extends TelemetryEvent {
  _T: 'LogCharacterCarry';
  _D?: string;
  carryState?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
}

/**
 * Care package spawn event
 */
export interface LogCarePackageSpawn extends TelemetryEvent {
  _T: 'LogCarePackageSpawn';
  _D?: string;
  common: TelemetryCommon;
  itemPackage?: any;
}

/**
 * Care package landing event
 */
export interface LogCarePackageLand extends TelemetryEvent {
  _T: 'LogCarePackageLand';
  _D?: string;
  common: TelemetryCommon;
  itemPackage?: any;
}

/**
 * Player prop destruction event
 */
export interface LogPlayerDestroyProp extends TelemetryEvent {
  _T: 'LogPlayerDestroyProp';
  _D?: string;
  attacker?: TelemetryPlayer;
  common: TelemetryCommon;
  objectLocation?: TelemetryLocation;
  objectType?: string;
}

/**
 * Emergency pickup lift off event
 */
export interface LogEmPickupLiftOff extends TelemetryEvent {
  _T: 'LogEmPickupLiftOff';
  _D?: string;
  common: TelemetryCommon;
  instigator?: any;
  riders?: any[];
}

/**
 * Item put to vehicle trunk event
 */
export interface LogItemPutToVehicleTrunk extends TelemetryEvent {
  _T: 'LogItemPutToVehicleTrunk';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  item?: TelemetryItem;
  vehicle?: TelemetryVehicle;
}

/**
 * Item pickup from vehicle trunk event
 */
export interface LogItemPickupFromVehicleTrunk extends TelemetryEvent {
  _T: 'LogItemPickupFromVehicleTrunk';
  _D?: string;
  character?: TelemetryPlayer;
  common: TelemetryCommon;
  item?: TelemetryItem;
  vehicle?: TelemetryVehicle;
}

/**
 * Match definition event
 */
export interface LogMatchDefinition extends TelemetryEvent {
  _T: 'LogMatchDefinition';
  MatchId?: string;
  PingQuality?: string;
  _D?: string;
}

/**
 * Player flare gun usage event
 */
export interface LogPlayerUseFlareGun extends TelemetryEvent {
  _T: 'LogPlayerUseFlareGun';
  _D?: string;
  attackId?: number;
  attackType?: string;
  attacker?: TelemetryPlayer;
  common: TelemetryCommon;
  fireWeaponStackCount?: number;
  weapon?: TelemetryItem;
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
  | LogItemUse
  | LogItemAttach
  | LogItemDetach
  | LogObjectInteraction
  | LogWeaponFireCount
  | LogVehicleDamage
  | LogObjectDestroy
  | LogItemPickupFromLootBox
  | LogVaultStart
  | LogPlayerUseThrowable
  | LogGameStatePeriodic
  | LogPlayerCreate
  | LogPlayerLogout
  | LogPlayerLogin
  | LogItemPickupFromCarepackage
  | LogWheelDestroy
  | LogPhaseChange
  | LogCharacterCarry
  | LogCarePackageSpawn
  | LogCarePackageLand
  | LogPlayerDestroyProp
  | LogEmPickupLiftOff
  | LogItemPutToVehicleTrunk
  | LogItemPickupFromVehicleTrunk
  | LogMatchDefinition
  | LogPlayerUseFlareGun
  | TelemetryEvent
>;
