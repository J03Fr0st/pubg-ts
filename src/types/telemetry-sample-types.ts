// Auto-generated from telemetry.sample.json
// Generated on: 2025-08-11T17:48:43.257Z
// Total events analyzed: 39841

import type { Character, Common, GameResult, TelemetryEvent } from './telemetry';

/**
 * LogPlayerPosition - Found 7762 instances
 */
export interface LogPlayerPosition extends TelemetryEvent {
  _T: 'LogPlayerPosition';
  _D?: string;
  character?: Character;
  common: Common;
  elapsedTime?: number;
  numAlivePlayers?: number;
  vehicle?: any;
}

/**
 * LogPlayerAttack - Found 6126 instances
 */
export interface LogPlayerAttack extends TelemetryEvent {
  _T: 'LogPlayerAttack';
  _D?: string;
  attackId?: number;
  attackType?: string;
  attacker?: any;
  common: Common;
  fireWeaponStackCount?: number;
  vehicle?: any;
  weapon?: any;
}

/**
 * LogItemPickup - Found 4688 instances
 */
export interface LogItemPickup extends TelemetryEvent {
  _T: 'LogItemPickup';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
}

/**
 * LogHeal - Found 4296 instances
 */
export interface LogHeal extends TelemetryEvent {
  _T: 'LogHeal';
  _D?: string;
  character?: Character;
  common: Common;
  healAmount?: number;
  item?: any;
}

/**
 * LogPlayerTakeDamage - Found 3605 instances
 */
export interface LogPlayerTakeDamage extends TelemetryEvent {
  _T: 'LogPlayerTakeDamage';
  _D?: string;
  attackId?: number;
  attacker?: any;
  common: Common;
  damage?: number;
  damageCauserName?: string;
  damageReason?: string;
  damageTypeCategory?: string;
  isThroughPenetrableWall?: boolean;
  victim?: Character;
}

/**
 * LogItemEquip - Found 1773 instances
 */
export interface LogItemEquip extends TelemetryEvent {
  _T: 'LogItemEquip';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
}

/**
 * LogItemUnequip - Found 1470 instances
 */
export interface LogItemUnequip extends TelemetryEvent {
  _T: 'LogItemUnequip';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
}

/**
 * LogItemUse - Found 1384 instances
 */
export interface LogItemUse extends TelemetryEvent {
  _T: 'LogItemUse';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
}

/**
 * LogItemAttach - Found 1271 instances
 */
export interface LogItemAttach extends TelemetryEvent {
  _T: 'LogItemAttach';
  _D?: string;
  character?: Character;
  childItem?: any;
  common: Common;
  parentItem?: any;
}

/**
 * LogItemDetach - Found 1256 instances
 */
export interface LogItemDetach extends TelemetryEvent {
  _T: 'LogItemDetach';
  _D?: string;
  character?: Character;
  childItem?: any;
  common: Common;
  parentItem?: any;
}

/**
 * LogObjectInteraction - Found 1231 instances
 */
export interface LogObjectInteraction extends TelemetryEvent {
  _T: 'LogObjectInteraction';
  _D?: string;
  character?: Character;
  common: Common;
  objectType?: string;
  objectTypeAdditionalInfo?: any[];
  objectTypeStatus?: string;
}

/**
 * LogItemDrop - Found 1038 instances
 */
export interface LogItemDrop extends TelemetryEvent {
  _T: 'LogItemDrop';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
}

/**
 * LogWeaponFireCount - Found 516 instances
 */
export interface LogWeaponFireCount extends TelemetryEvent {
  _T: 'LogWeaponFireCount';
  _D?: string;
  character?: Character;
  common: Common;
  fireCount?: number;
  weaponId?: string;
}

/**
 * LogVehicleDamage - Found 495 instances
 */
export interface LogVehicleDamage extends TelemetryEvent {
  _T: 'LogVehicleDamage';
  _D?: string;
  attackId?: number;
  attacker?: any;
  common: Common;
  damage?: number;
  damageCauserName?: string;
  damageTypeCategory?: string;
  distance?: number;
  vehicle?: any;
}

/**
 * LogObjectDestroy - Found 442 instances
 */
export interface LogObjectDestroy extends TelemetryEvent {
  _T: 'LogObjectDestroy';
  _D?: string;
  character?: Character;
  common: Common;
  damageCauserName?: string;
  objectLocation?: any;
  objectType?: string;
}

/**
 * LogItemPickupFromLootBox - Found 438 instances
 */
export interface LogItemPickupFromLootBox extends TelemetryEvent {
  _T: 'LogItemPickupFromLootBox';
  _D?: string;
  character?: Character;
  common: Common;
  creatorAccountId?: string;
  item?: any;
  ownerTeamId?: number;
}

/**
 * LogVaultStart - Found 421 instances
 */
export interface LogVaultStart extends TelemetryEvent {
  _T: 'LogVaultStart';
  _D?: string;
  character?: Character;
  common: Common;
  isLedgeGrab?: boolean;
  isVaultOnVehicle?: boolean;
}

/**
 * LogVehicleRide - Found 268 instances
 */
export interface LogVehicleRide extends TelemetryEvent {
  _T: 'LogVehicleRide';
  _D?: string;
  character?: Character;
  common: Common;
  fellowPassengers?: any[];
  seatIndex?: number;
  vehicle?: any;
}

/**
 * LogVehicleLeave - Found 268 instances
 */
export interface LogVehicleLeave extends TelemetryEvent {
  _T: 'LogVehicleLeave';
  _D?: string;
  character?: Character;
  common: Common;
  fellowPassengers?: any[];
  maxSpeed?: number;
  rideDistance?: number;
  seatIndex?: number;
  vehicle?: any;
}

/**
 * LogPlayerUseThrowable - Found 171 instances
 */
export interface LogPlayerUseThrowable extends TelemetryEvent {
  _T: 'LogPlayerUseThrowable';
  _D?: string;
  attackId?: number;
  attackType?: string;
  attacker?: any;
  common: Common;
  fireWeaponStackCount?: number;
  weapon?: any;
}

/**
 * LogGameStatePeriodic - Found 157 instances
 */
export interface LogGameStatePeriodic extends TelemetryEvent {
  _T: 'LogGameStatePeriodic';
  _D?: string;
  common: Common;
  gameState?: any;
}

/**
 * LogParachuteLanding - Found 116 instances
 */
export interface LogParachuteLanding extends TelemetryEvent {
  _T: 'LogParachuteLanding';
  _D?: string;
  character?: Character;
  common: Common;
  distance?: number;
}

/**
 * LogPlayerCreate - Found 112 instances
 */
export interface LogPlayerCreate extends TelemetryEvent {
  _T: 'LogPlayerCreate';
  _D?: string;
  character?: Character;
  common: Common;
}

/**
 * LogPlayerLogout - Found 101 instances
 */
export interface LogPlayerLogout extends TelemetryEvent {
  _T: 'LogPlayerLogout';
  _D?: string;
  accountId?: string;
  common: Common;
}

/**
 * LogPlayerLogin - Found 99 instances
 */
export interface LogPlayerLogin extends TelemetryEvent {
  _T: 'LogPlayerLogin';
  _D?: string;
  accountId?: string;
  common: Common;
}

/**
 * LogPlayerKillV2 - Found 94 instances
 */
export interface LogPlayerKillV2 extends TelemetryEvent {
  _T: 'LogPlayerKillV2';
  _D?: string;
  assists_AccountId?: any[];
  attackId?: number;
  common: Common;
  dBNODamageInfo?: any;
  dBNOId?: number;
  dBNOMaker?: any;
  finishDamageInfo?: any;
  finisher?: any;
  isSuicide?: boolean;
  killer?: Character;
  killerDamageInfo?: any;
  killerVehicle?: any;
  teamKillers_AccountId?: any[];
  victim?: Character;
  victimGameResult?: GameResult;
  victimVehicle?: any;
  victimWeapon?: string;
  victimWeaponAdditionalInfo?: any[];
}

/**
 * LogPlayerMakeGroggy - Found 69 instances
 */
export interface LogPlayerMakeGroggy extends TelemetryEvent {
  _T: 'LogPlayerMakeGroggy';
  _D?: string;
  attackId?: number;
  attacker?: any;
  common: Common;
  dBNOId?: number;
  damageCauserAdditionalInfo?: any[];
  damageCauserName?: string;
  damageReason?: string;
  damageTypeCategory?: string;
  distance?: number;
  isAttackerInVehicle?: boolean;
  isThroughPenetrableWall?: boolean;
  victim?: Character;
  victimWeapon?: string;
  victimWeaponAdditionalInfo?: any[];
}

/**
 * LogArmorDestroy - Found 47 instances
 */
export interface LogArmorDestroy extends TelemetryEvent {
  _T: 'LogArmorDestroy';
  _D?: string;
  attackId?: number;
  attacker?: any;
  common: Common;
  damageCauserName?: string;
  damageReason?: string;
  damageTypeCategory?: string;
  distance?: number;
  item?: any;
  victim?: Character;
}

/**
 * LogPlayerRevive - Found 24 instances
 */
export interface LogPlayerRevive extends TelemetryEvent {
  _T: 'LogPlayerRevive';
  _D?: string;
  common: Common;
  dBNOId?: number;
  reviver?: any;
  useTraumaBag?: boolean;
  victim?: Character;
}

/**
 * LogItemPickupFromCarepackage - Found 21 instances
 */
export interface LogItemPickupFromCarepackage extends TelemetryEvent {
  _T: 'LogItemPickupFromCarepackage';
  _D?: string;
  carePackageName?: string;
  carePackageUniqueId?: number;
  character?: Character;
  common: Common;
  item?: any;
}

/**
 * LogWheelDestroy - Found 18 instances
 */
export interface LogWheelDestroy extends TelemetryEvent {
  _T: 'LogWheelDestroy';
  _D?: string;
  attackId?: number;
  attacker?: any;
  common: Common;
  damageCauserName?: string;
  damageTypeCategory?: string;
  vehicle?: any;
  wheelIndex?: number;
}

/**
 * LogPhaseChange - Found 16 instances
 */
export interface LogPhaseChange extends TelemetryEvent {
  _T: 'LogPhaseChange';
  _D?: string;
  common: Common;
  phase?: number;
  playersInWhiteCircle?: string[];
}

/**
 * LogCharacterCarry - Found 12 instances
 */
export interface LogCharacterCarry extends TelemetryEvent {
  _T: 'LogCharacterCarry';
  _D?: string;
  carryState?: string;
  character?: Character;
  common: Common;
}

/**
 * LogSwimStart - Found 8 instances
 */
export interface LogSwimStart extends TelemetryEvent {
  _T: 'LogSwimStart';
  _D?: string;
  character?: Character;
  common: Common;
}

/**
 * LogCarePackageSpawn - Found 4 instances
 */
export interface LogCarePackageSpawn extends TelemetryEvent {
  _T: 'LogCarePackageSpawn';
  _D?: string;
  common: Common;
  itemPackage?: any;
}

/**
 * LogCarePackageLand - Found 4 instances
 */
export interface LogCarePackageLand extends TelemetryEvent {
  _T: 'LogCarePackageLand';
  _D?: string;
  common: Common;
  itemPackage?: any;
}

/**
 * LogPlayerDestroyProp - Found 4 instances
 */
export interface LogPlayerDestroyProp extends TelemetryEvent {
  _T: 'LogPlayerDestroyProp';
  _D?: string;
  attacker?: any;
  common: Common;
  objectLocation?: any;
  objectType?: string;
}

/**
 * LogEmPickupLiftOff - Found 3 instances
 */
export interface LogEmPickupLiftOff extends TelemetryEvent {
  _T: 'LogEmPickupLiftOff';
  _D?: string;
  common: Common;
  instigator?: any;
  riders?: any[];
}

/**
 * LogVehicleDestroy - Found 3 instances
 */
export interface LogVehicleDestroy extends TelemetryEvent {
  _T: 'LogVehicleDestroy';
  _D?: string;
  attackId?: number;
  attacker?: any;
  common: Common;
  damageCauserName?: string;
  damageTypeCategory?: string;
  distance?: number;
  vehicle?: any;
}

/**
 * LogSwimEnd - Found 2 instances
 */
export interface LogSwimEnd extends TelemetryEvent {
  _T: 'LogSwimEnd';
  _D?: string;
  character?: Character;
  common: Common;
  maxSwimDepthOfWater?: number;
  swimDistance?: number;
}

/**
 * LogItemPutToVehicleTrunk - Found 2 instances
 */
export interface LogItemPutToVehicleTrunk extends TelemetryEvent {
  _T: 'LogItemPutToVehicleTrunk';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
  vehicle?: any;
}

/**
 * LogItemPickupFromVehicleTrunk - Found 2 instances
 */
export interface LogItemPickupFromVehicleTrunk extends TelemetryEvent {
  _T: 'LogItemPickupFromVehicleTrunk';
  _D?: string;
  character?: Character;
  common: Common;
  item?: any;
  vehicle?: any;
}

/**
 * LogMatchDefinition - Found 1 instances
 */
export interface LogMatchDefinition extends TelemetryEvent {
  _T: 'LogMatchDefinition';
  MatchId?: string;
  PingQuality?: string;
  _D?: string;
}

/**
 * LogMatchStart - Found 1 instances
 */
export interface LogMatchStart extends TelemetryEvent {
  _T: 'LogMatchStart';
  _D?: string;
  blueZoneCustomOptions?: string;
  cameraViewBehaviour?: string;
  characters?: any[];
  common: Common;
  isCustomGame?: boolean;
  isEventMode?: boolean;
  mapName?: string;
  teamSize?: number;
  weatherId?: string;
}

/**
 * LogPlayerUseFlareGun - Found 1 instances
 */
export interface LogPlayerUseFlareGun extends TelemetryEvent {
  _T: 'LogPlayerUseFlareGun';
  _D?: string;
  attackId?: number;
  attackType?: string;
  attacker?: any;
  common: Common;
  fireWeaponStackCount?: number;
  weapon?: any;
}

/**
 * LogMatchEnd - Found 1 instances
 */
export interface LogMatchEnd extends TelemetryEvent {
  _T: 'LogMatchEnd';
  _D?: string;
  allWeaponStats?: any[];
  characters?: any[];
  common: Common;
  gameResultOnFinished?: any;
}

/**
 * Union type of all telemetry events found in sample
 */
export type SampleTelemetryEvent =
  | LogPlayerPosition
  | LogPlayerAttack
  | LogItemPickup
  | LogHeal
  | LogPlayerTakeDamage
  | LogItemEquip
  | LogItemUnequip
  | LogItemUse
  | LogItemAttach
  | LogItemDetach
  | LogObjectInteraction
  | LogItemDrop
  | LogWeaponFireCount
  | LogVehicleDamage
  | LogObjectDestroy
  | LogItemPickupFromLootBox
  | LogVaultStart
  | LogVehicleRide
  | LogVehicleLeave
  | LogPlayerUseThrowable
  | LogGameStatePeriodic
  | LogParachuteLanding
  | LogPlayerCreate
  | LogPlayerLogout
  | LogPlayerLogin
  | LogPlayerKillV2
  | LogPlayerMakeGroggy
  | LogArmorDestroy
  | LogPlayerRevive
  | LogItemPickupFromCarepackage
  | LogWheelDestroy
  | LogPhaseChange
  | LogCharacterCarry
  | LogSwimStart
  | LogCarePackageSpawn
  | LogCarePackageLand
  | LogPlayerDestroyProp
  | LogEmPickupLiftOff
  | LogVehicleDestroy
  | LogSwimEnd
  | LogItemPutToVehicleTrunk
  | LogItemPickupFromVehicleTrunk
  | LogMatchDefinition
  | LogMatchStart
  | LogPlayerUseFlareGun
  | LogMatchEnd;
