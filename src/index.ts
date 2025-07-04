export { PubgClient } from './api/client';
export * from './errors';
export * from './types';
export { AssetManager, assetManager } from './utils/assets';

// Explicit re-exports from types/assets to avoid conflicts
export type {
  EnhancedItemInfo,
  EnhancedVehicleInfo,
  EnhancedSeasonInfo,
  SurvivalTitleInfo,
  ItemDictionary,
  VehicleDictionary,
  AssetConfig
} from './utils/assets';

// Asset-specific types with prefixes to avoid conflicts
export type {
  ItemId,
  ItemDictionary as AssetItemDictionary,
  ITEM_DICTIONARY
} from './types/assets/items';

export type {
  VehicleId,
  VehicleDictionary as AssetVehicleDictionary,
  VEHICLE_DICTIONARY
} from './types/assets/vehicles';

export type {
  MapId,
  MapDictionary,
  MAP_DICTIONARY,
  MapName as AssetMapName
} from './types/assets/maps';

export type {
  SeasonData,
  SeasonsData,
  SEASONS_DATA,
  Platform as AssetPlatform,
  SeasonAttributes as AssetSeasonAttributes
} from './types/assets/seasons';

export type {
  DamageReason,
  AttackType,
  CarryState,
  ObjectType,
  ObjectTypeStatus,
  WeatherId,
  RegionIdChimera_Main,
  RegionIdDesert_Main,
  RegionIdDihorOtok_Main,
  RegionIdErangel_Main,
  RegionIdHeaven_Main,
  RegionIdSavage_Main,
  RegionIdSummerland_Main,
  RegionIdTiger_Main
} from './types/assets/enums';
