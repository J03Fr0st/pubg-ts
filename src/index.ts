export { PubgClient } from './api/client';
export * from './errors';
export * from './types';
export type {
  AttackType,
  CarryState,
  DamageReason,
  ObjectType,
  ObjectTypeStatus,
  RegionIdChimera_Main,
  RegionIdDesert_Main,
  RegionIdDihorOtok_Main,
  RegionIdErangel_Main,
  RegionIdHeaven_Main,
  RegionIdSavage_Main,
  RegionIdSummerland_Main,
  RegionIdTiger_Main,
  WeatherId,
} from './types/assets/enums';
// Asset-specific types with prefixes to avoid conflicts
export type {
  ITEM_DICTIONARY,
  ItemDictionary as AssetItemDictionary,
  ItemId,
} from './types/assets/items';
export type {
  MAP_DICTIONARY,
  MapDictionary,
  MapId,
  MapName as AssetMapName,
} from './types/assets/maps';
export type {
  Platform as AssetPlatform,
  SEASONS_DATA,
  SeasonAttributes as AssetSeasonAttributes,
  SeasonData,
  SeasonsData,
} from './types/assets/seasons';
export type {
  VEHICLE_DICTIONARY,
  VehicleDictionary as AssetVehicleDictionary,
  VehicleId,
} from './types/assets/vehicles';
// Explicit re-exports from types/assets to avoid conflicts
export type {
  AssetConfig,
  EnhancedItemInfo,
  EnhancedSeasonInfo,
  EnhancedVehicleInfo,
  SurvivalTitleInfo,
} from './utils/assets';
export { AssetManager, assetManager } from './utils/assets';
