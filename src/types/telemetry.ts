export interface TelemetryEvent {
  _D?: string;
  _T: string;
  common: Common;
}

/**
 * Common context for all telemetry events
 *
 * isGame represents the phase of the game defined by the status of bluezone and safezone:
 * isGame = 0 -> Before lift off
 * isGame = 0.1 -> On airplane
 * isGame = 0.5 -> When there's no 'zone' on map(before game starts)
 * isGame = 1.0 -> First safezone and bluezone appear
 * isGame = 1.5 -> First bluezone shrinks
 * isGame = 2.0 -> Second bluezone appears
 * isGame = 2.5 -> Second bluezone shrinks
 * ...
 */
export interface Common {
  isGame: number;
  matchId?: string;
  mapName?: string;
}

export interface Character {
  name: string;
  teamId: number;
  health: number;
  location: Location;
  ranking: number;
  accountId: string;
  isInBlueZone: boolean;
  isInRedZone: boolean;
  zone: string[]; // regionId array
}

export interface CharacterWrapper {
  character: Character;
  primaryWeaponFirst: string;
  primaryWeaponSecond: string;
  secondaryWeapon: string;
  spawnKitIndex: number;
}

/**
 * Location coordinates
 *
 * - Location values are measured in centimeters
 * - (0,0) is at the top-left of each map
 * - The range for the X and Y axes is 0 - 816,000 for Erangel, Miramar, Taego, Vikendi and Deston
 * - The range for the X and Y axes is 0 - 408,000 for Sanhok
 * - The range for the X and Y axes is 0 - 306,000 for Paramo
 * - The range for the X and Y axes is 0 - 204,000 for Karakin and Range
 * - The range for the X and Y axes is 0 - 102,000 for Haven
 */
export interface Location {
  x: number;
  y: number;
  z: number;
}

export interface DamageInfo {
  damageReason: string;
  damageTypeCategory: string;
  damageCauserName: string;
  additionalInfo: string[];
  distance: number;
  isThroughPenetrableWall: boolean;
}

export interface GameResult {
  rank: number;
  gameResult: string;
  teamId: number;
  stats: Stats;
  accountId: string;
}

export interface GameResultOnFinished {
  results: GameResult[]; // Shows winning players only
}

export interface GameState {
  elapsedTime: number;
  numAliveTeams: number;
  numJoinPlayers: number;
  numStartPlayers: number;
  numAlivePlayers: number;
  safetyZonePosition: Location;
  safetyZoneRadius: number;
  poisonGasWarningPosition: Location;
  poisonGasWarningRadius: number;
  redZonePosition: Location;
  redZoneRadius: number;
  blackZonePosition: Location;
  blackZoneRadius: number;
}

export interface Item {
  itemId: string;
  stackCount: number;
  category: string;
  subCategory: string;
  attachedItems: string[]; // itemId array
}

export interface ItemPackage {
  itemPackageId: string;
  location: Location;
  items: Item[];
}

export interface Stats {
  killCount: number;
  distanceOnFoot: number;
  distanceOnSwim: number;
  distanceOnVehicle: number;
  distanceOnParachute: number;
  distanceOnFreefall: number;
}

export interface Vehicle {
  vehicleType: string;
  vehicleId: string;
  vehicleUniqueId: number;
  healthPercent: number;
  feulPercent: number;
  altitudeAbs: number;
  altitudeRel: number;
  velocity: number;
  seatIndex: number;
  isWheelsInAir: boolean;
  isInWaterVolume: boolean;
  isEngineOn: boolean;
}

/**
 * Blue Zone Custom Options
 * The blueZoneCustomOptions string contains an array of config objects for each blue zone phase
 */
export interface BlueZoneCustomOptions {
  phaseNum: number;
  startDelay: number;
  warningDuration: number;
  releaseDuration: number;
  poisonGasDamagePerSecond: number;
  radiusRate: number;
  spreadRatio: number;
  landRatio: number;
  circleAlgorithm: number;
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

export interface LogPlayerKill extends TelemetryEvent {
  _T: 'LogPlayerKill';
  attackId: number;
  killer: Character;
  victim: Character;
  assistant?: Character;
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
  victimGameResult: GameResult;
}

export interface LogPlayerKillV2 extends TelemetryEvent {
  _T: 'LogPlayerKillV2';
  attackId: number;
  dBNOMaker?: Character;
  killer: Character;
  victim: Character;
  finisher?: Character;
  assists: Character[];
  teamKillers: Character[];
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
  victimVehicle?: Vehicle;
  killerVehicle?: Vehicle;
  finishDamageInfo?: FlexibleDamageInfo;
  dBNODamageInfo?: FlexibleDamageInfo;
}

export interface LogPlayerMakeGroggy extends TelemetryEvent {
  _T: 'LogPlayerMakeGroggy';
  attackId: number;
  attacker: Character;
  victim: Character;
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
  character: Character;
  elapsedTime: number;
  numAlivePlayers: number;
  isGame: number;
}

export interface LogPlayerTakeDamage extends TelemetryEvent {
  _T: 'LogPlayerTakeDamage';
  attackId: number;
  attacker: Character;
  victim: Character;
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
  attacker: Character;
  attackType: string;
  weapon: Item;
  vehicle?: Vehicle;
}

export interface LogItemPickup extends TelemetryEvent {
  _T: 'LogItemPickup';
  character: Character;
  item: Item;
}

export interface LogItemDrop extends TelemetryEvent {
  _T: 'LogItemDrop';
  character: Character;
  item: Item;
}

export interface LogItemEquip extends TelemetryEvent {
  _T: 'LogItemEquip';
  character: Character;
  item: Item;
}

export interface LogItemUnequip extends TelemetryEvent {
  _T: 'LogItemUnequip';
  character: Character;
  item: Item;
}

export interface LogVehicleRide extends TelemetryEvent {
  _T: 'LogVehicleRide';
  character: Character;
  vehicle: Vehicle;
  seatIndex: number;
}

export interface LogVehicleLeave extends TelemetryEvent {
  _T: 'LogVehicleLeave';
  character: Character;
  vehicle: Vehicle;
  rideDistance: number;
  seatIndex: number;
  maxSpeed: number;
}

export interface LogVehicleDestroy extends TelemetryEvent {
  _T: 'LogVehicleDestroy';
  attackId: number;
  attacker: Character;
  vehicle: Vehicle;
  damageTypeCategory: string;
  damageCauserName: string;
  distance: number;
}

export interface LogSwimStart extends TelemetryEvent {
  _T: 'LogSwimStart';
  character: Character;
}

export interface LogSwimEnd extends TelemetryEvent {
  _T: 'LogSwimEnd';
  character: Character;
  swimDistance: number;
  maxSwimDepthOfWater: number;
}

export interface LogArmorDestroy extends TelemetryEvent {
  _T: 'LogArmorDestroy';
  attackId: number;
  attacker: Character;
  victim: Character;
  damageTypeCategory: string;
  damageReason: string;
  damageCauserName: string;
  item: Item;
  distance: number;
}

export interface LogParachuteLanding extends TelemetryEvent {
  _T: 'LogParachuteLanding';
  character: Character;
  distance: number;
}

export interface LogPlayerRevive extends TelemetryEvent {
  _T: 'LogPlayerRevive';
  reviver: Character;
  victim: Character;
}

export interface LogHeal extends TelemetryEvent {
  _T: 'LogHeal';
  character: Character;
  item: Item;
  healAmount: number;
}

export interface LogMatchStart extends TelemetryEvent {
  _T: 'LogMatchStart';
  characters: Character[];
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
  characters: Character[];
  gameResultOnFinished: GameResultOnFinished;
}

/**
 * Item usage event
 */
export interface LogItemUse extends TelemetryEvent {
  _T: 'LogItemUse';
  _D?: string;
  character?: Character;
  common: Common;
  item?: Item;
}

/**
 * Item attachment event
 */
export interface LogItemAttach extends TelemetryEvent {
  _T: 'LogItemAttach';
  _D?: string;
  character?: Character;
  childItem?: Item;
  common: Common;
  parentItem?: Item;
}

/**
 * Item detachment event
 */
export interface LogItemDetach extends TelemetryEvent {
  _T: 'LogItemDetach';
  _D?: string;
  character?: Character;
  childItem?: Item;
  common: Common;
  parentItem?: Item;
}

/**
 * Object interaction event
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
 * Weapon fire count event
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
 * Vehicle damage event
 */
export interface LogVehicleDamage extends TelemetryEvent {
  _T: 'LogVehicleDamage';
  _D?: string;
  attackId?: number;
  attacker?: Character;
  common: Common;
  damage?: number;
  damageCauserName?: string;
  damageTypeCategory?: string;
  distance?: number;
  vehicle?: Vehicle;
}

/**
 * Object destruction event
 */
export interface LogObjectDestroy extends TelemetryEvent {
  _T: 'LogObjectDestroy';
  _D?: string;
  character?: Character;
  common: Common;
  damageCauserName?: string;
  objectLocation?: Location;
  objectType?: string;
}

/**
 * Item pickup from loot box event
 */
export interface LogItemPickupFromLootBox extends TelemetryEvent {
  _T: 'LogItemPickupFromLootBox';
  _D?: string;
  character?: Character;
  common: Common;
  creatorAccountId?: string;
  item?: Item;
  ownerTeamId?: number;
}

/**
 * Vault/climb action start event
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
 * Player throwable usage event
 */
export interface LogPlayerUseThrowable extends TelemetryEvent {
  _T: 'LogPlayerUseThrowable';
  _D?: string;
  attackId?: number;
  attackType?: string;
  attacker?: Character;
  common: Common;
  fireWeaponStackCount?: number;
  weapon?: Item;
}

/**
 * Periodic game state event
 */
export interface LogGameStatePeriodic extends TelemetryEvent {
  _T: 'LogGameStatePeriodic';
  _D?: string;
  common: Common;
  gameState?: GameState;
}

/**
 * Player creation event
 */
export interface LogPlayerCreate extends TelemetryEvent {
  _T: 'LogPlayerCreate';
  _D?: string;
  character?: Character;
  common: Common;
}

/**
 * Player logout event
 */
export interface LogPlayerLogout extends TelemetryEvent {
  _T: 'LogPlayerLogout';
  _D?: string;
  accountId?: string;
  common: Common;
}

/**
 * Player login event
 */
export interface LogPlayerLogin extends TelemetryEvent {
  _T: 'LogPlayerLogin';
  _D?: string;
  accountId?: string;
  common: Common;
}

/**
 * Item pickup from care package event
 */
export interface LogItemPickupFromCarepackage extends TelemetryEvent {
  _T: 'LogItemPickupFromCarepackage';
  _D?: string;
  carePackageName?: string;
  carePackageUniqueId?: number;
  character?: Character;
  common: Common;
  item?: Item;
}

/**
 * Vehicle wheel destruction event
 */
export interface LogWheelDestroy extends TelemetryEvent {
  _T: 'LogWheelDestroy';
  _D?: string;
  attackId?: number;
  attacker?: Character;
  common: Common;
  damageCauserName?: string;
  damageTypeCategory?: string;
  vehicle?: Vehicle;
  wheelIndex?: number;
}

/**
 * Game phase change event
 */
export interface LogPhaseChange extends TelemetryEvent {
  _T: 'LogPhaseChange';
  _D?: string;
  common: Common;
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
  character?: Character;
  common: Common;
}

/**
 * Care package spawn event
 */
export interface LogCarePackageSpawn extends TelemetryEvent {
  _T: 'LogCarePackageSpawn';
  _D?: string;
  common: Common;
  itemPackage?: ItemPackage;
}

/**
 * Care package landing event
 */
export interface LogCarePackageLand extends TelemetryEvent {
  _T: 'LogCarePackageLand';
  _D?: string;
  common: Common;
  itemPackage?: ItemPackage;
}

/**
 * Player prop destruction event
 */
export interface LogPlayerDestroyProp extends TelemetryEvent {
  _T: 'LogPlayerDestroyProp';
  _D?: string;
  attacker?: Character;
  common: Common;
  objectLocation?: Location;
  objectType?: string;
}

/**
 * Emergency pickup lift off event
 */
export interface LogEmPickupLiftOff extends TelemetryEvent {
  _T: 'LogEmPickupLiftOff';
  _D?: string;
  common: Common;
  instigator?: any;
  riders?: any[];
}

/**
 * Item put to vehicle trunk event
 */
export interface LogItemPutToVehicleTrunk extends TelemetryEvent {
  _T: 'LogItemPutToVehicleTrunk';
  _D?: string;
  character?: Character;
  common: Common;
  item?: Item;
  vehicle?: Vehicle;
}

/**
 * Item pickup from vehicle trunk event
 */
export interface LogItemPickupFromVehicleTrunk extends TelemetryEvent {
  _T: 'LogItemPickupFromVehicleTrunk';
  _D?: string;
  character?: Character;
  common: Common;
  item?: Item;
  vehicle?: Vehicle;
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
  attacker?: Character;
  common: Common;
  fireWeaponStackCount?: number;
  weapon?: Item;
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
