import damageCauserNameData from '../../assets/dictionaries/damage-causer-name.json';
import damageTypeCategoryData from '../../assets/dictionaries/damage-type-category.json';
import gameModeData from '../../assets/dictionaries/game-mode.json';
import itemIdData from '../../assets/dictionaries/item-id.json';
import mapNameData from '../../assets/dictionaries/map-name.json';
import vehicleIdData from '../../assets/dictionaries/vehicle-id.json';
import seasonsData from '../../assets/seasons.json';
import survivalTitlesData from '../../assets/survival-titles.json';
import { PubgAssetError, PubgConfigurationError } from '../../errors';
import type { Platform, SeasonData } from '../../types/assets/seasons';
import {
  buildAssetUrl,
  categorizeItem,
  categorizeVehicle,
  humanizeItemId,
  humanizeMapId,
  humanizeSeasonId,
  humanizeVehicleId,
  isOffseasonEndDate,
  isRatingInRange,
  isSeasonActive,
  subcategorizeItem,
} from './normalization';
import { createItemSearchIndex, type ItemSearchIndex, searchItems } from './search';

/** Configuration for generated asset URLs. Catalog data is always bundled locally. */
export interface AssetCatalogConfig {
  /** Base URL used when generating asset image URLs. */
  assetBaseUrl?: string;
}

export interface EnhancedItemInfo {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
}

export interface EnhancedVehicleInfo {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
}

export interface EnhancedSeasonInfo {
  id: string;
  platform: Platform;
  name: string;
  startDate: string;
  endDate: string;
  /** Season Activity: whether the season is running at the moment it was read. */
  isActive: boolean;
  isOffseason: boolean;
}

export interface SurvivalTitleInfo {
  title: string;
  level: number;
  pointsRequired: string;
  description?: string;
}

interface SurvivalTitleData {
  title: number;
  levels: Array<{
    level: number;
    survivalPoints: string;
    demotion: boolean;
  }>;
}

type StableSeasonInfo = Omit<EnhancedSeasonInfo, 'isActive'>;

/** Everything one dictionary-backed lookup needs; items and vehicles differ only in these fields. */
interface AssetLookup<T> {
  readonly assetType: 'item' | 'vehicle';
  readonly dictionary: Record<string, string>;
  readonly cache: Map<string, T>;
  readonly enrich: (id: string, name: string) => T;
}

const DEFAULT_CONFIG: Required<AssetCatalogConfig> = {
  assetBaseUrl: 'https://raw.githubusercontent.com/pubg/api-assets/master',
};

const ITEM_NAMES: Record<string, string> = itemIdData;
const VEHICLE_NAMES: Record<string, string> = vehicleIdData;
const MAP_NAMES: Record<string, string> = mapNameData;
const DAMAGE_CAUSER_NAMES: Record<string, string> = damageCauserNameData;
const DAMAGE_TYPE_CATEGORIES: Record<string, string> = damageTypeCategoryData;
const GAME_MODE_NAMES: Record<string, string> = gameModeData;
const SEASONS_BY_PLATFORM: Record<Platform, SeasonData[]> = seasonsData;
const SURVIVAL_TITLES: Record<string, SurvivalTitleData> = survivalTitlesData;

// Only bundled own properties are catalog entries; inherited object properties are unknown.
const dictionaryName = (dictionary: Record<string, string>, id: string): string | undefined =>
  Object.getOwnPropertyDescriptor(dictionary, id)?.value;

const ITEM_IDS = Object.keys(ITEM_NAMES);
const VEHICLE_IDS = Object.keys(VEHICLE_NAMES);
const MAP_ENTRIES = Object.entries(MAP_NAMES);
const VALID_PLATFORMS = Object.keys(SEASONS_BY_PLATFORM) as Platform[];

/**
 * Local-only catalog of the PUBG asset data bundled with the SDK.
 *
 * `getItemInfo` and `getVehicleInfo` reject empty or non-string IDs with {@link PubgAssetError}
 * and return `null` for unknown IDs. Season lookups reject unsupported platforms with
 * {@link PubgConfigurationError}; `getActiveSeason` returns `null` when no season is active.
 * `getSurvivalTitle` rejects invalid ratings with {@link PubgAssetError} and returns `null` when
 * no title matches. Name lookups expect strings and do not validate malformed inputs; unknown
 * names fall back to a humanized or original identifier. Returned metadata records are caller-owned
 * copies; editing them never changes the catalog. Catalog reads never perform I/O.
 */
export class AssetCatalog {
  private readonly config: Required<AssetCatalogConfig>;
  private readonly itemLookup: AssetLookup<EnhancedItemInfo> = {
    assetType: 'item',
    dictionary: ITEM_NAMES,
    cache: new Map(),
    enrich: (id, name) => ({
      id,
      name,
      category: categorizeItem(id),
      subcategory: subcategorizeItem(id),
      description: name,
    }),
  };
  private readonly vehicleLookup: AssetLookup<EnhancedVehicleInfo> = {
    assetType: 'vehicle',
    dictionary: VEHICLE_NAMES,
    cache: new Map(),
    enrich: (id, name) => ({
      id,
      name,
      type: categorizeVehicle(id),
      category: 'vehicle',
      description: name,
    }),
  };
  private readonly seasonCache: Map<Platform, StableSeasonInfo[]> = new Map();
  private readonly itemSearchIndex: ItemSearchIndex<EnhancedItemInfo>;

  constructor(config: AssetCatalogConfig = {}) {
    this.config = {
      assetBaseUrl: config?.assetBaseUrl ?? DEFAULT_CONFIG.assetBaseUrl,
    };

    const allItems = ITEM_IDS.map((id) => this.getItemInfo(id)!);
    this.itemSearchIndex = createItemSearchIndex(allItems);
  }

  getItemName(itemId: string): string {
    return dictionaryName(ITEM_NAMES, itemId) || humanizeItemId(itemId);
  }

  getItemInfo(itemId: string): EnhancedItemInfo | null {
    return this.lookup(itemId, this.itemLookup);
  }

  getItemsByCategory(category: string): EnhancedItemInfo[] {
    const items: EnhancedItemInfo[] = [];

    for (const itemId of ITEM_IDS) {
      const info = this.getItemInfo(itemId);
      if (info && info.category === category) {
        items.push(info);
      }
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  searchItems(query: string): EnhancedItemInfo[] {
    return searchItems(this.itemSearchIndex, query).map((item) => ({ ...item }));
  }

  getVehicleName(vehicleId: string): string {
    return dictionaryName(VEHICLE_NAMES, vehicleId) || humanizeVehicleId(vehicleId);
  }

  getVehicleInfo(vehicleId: string): EnhancedVehicleInfo | null {
    return this.lookup(vehicleId, this.vehicleLookup);
  }

  getMapName(mapId: string): string {
    return dictionaryName(MAP_NAMES, mapId) || humanizeMapId(mapId);
  }

  getAllMaps(): Array<{ id: string; name: string }> {
    return MAP_ENTRIES.map(([id, name]) => ({
      id,
      name,
    }));
  }

  getSeasonsByPlatform(platform: Platform): EnhancedSeasonInfo[] {
    if (!VALID_PLATFORMS.includes(platform)) {
      throw new PubgConfigurationError(
        `Invalid platform '${platform}'. Valid platforms are: ${VALID_PLATFORMS.join(', ')}`,
        'platform',
        'Platform',
        platform
      );
    }

    let stableSeasons = this.seasonCache.get(platform);

    if (!stableSeasons) {
      stableSeasons = SEASONS_BY_PLATFORM[platform].map((season) => ({
        id: season.id,
        platform,
        name: humanizeSeasonId(season.id),
        startDate: season.attributes.startDate,
        endDate: season.attributes.endDate,
        isOffseason: isOffseasonEndDate(season.attributes.endDate),
      }));
      this.seasonCache.set(platform, stableSeasons);
    }

    const now = new Date();
    return stableSeasons.map((season) => ({
      ...season,
      isActive: isSeasonActive(season.startDate, season.endDate, now),
    }));
  }

  /**
   * Returns the bundled season whose Season Activity is current for the platform, or `null`
   * when no bundled season covers today. This reads local dates; `client.seasons.getCurrentSeason()`
   * asks PUBG instead.
   */
  getActiveSeason(platform: Platform = 'PC'): EnhancedSeasonInfo | null {
    if (!platform || typeof platform !== 'string') {
      throw new PubgConfigurationError(
        'Invalid platform provided',
        'platform',
        'Platform',
        platform
      );
    }

    const seasons = this.getSeasonsByPlatform(platform);
    return seasons.find((season) => season.isActive) || null;
  }

  getSurvivalTitle(rating: number): SurvivalTitleInfo | null {
    if (typeof rating !== 'number' || rating < 0 || !Number.isFinite(rating)) {
      throw new PubgAssetError(
        'Invalid survival rating provided',
        String(rating),
        'survival_title',
        { operation: 'get_survival_title', metadata: { providedRating: rating } }
      );
    }

    for (const [titleName, titleData] of Object.entries(SURVIVAL_TITLES)) {
      for (const levelInfo of titleData.levels) {
        if (isRatingInRange(rating, levelInfo.survivalPoints)) {
          return {
            title: titleName,
            level: levelInfo.level,
            pointsRequired: levelInfo.survivalPoints,
            description: `${titleName} Level ${levelInfo.level}`,
          };
        }
      }
    }

    return null;
  }

  getDamageCauserName(causerId: string): string {
    return dictionaryName(DAMAGE_CAUSER_NAMES, causerId) || causerId;
  }

  getDamageTypeCategory(damageType: string): string {
    return dictionaryName(DAMAGE_TYPE_CATEGORIES, damageType) || damageType;
  }

  getGameModeName(gameModeId: string): string {
    return dictionaryName(GAME_MODE_NAMES, gameModeId) || gameModeId;
  }

  getAssetUrl(category: string, itemId: string, type: 'icon' | 'image' = 'icon'): string {
    return buildAssetUrl(this.config.assetBaseUrl, category, itemId, type);
  }

  /** Generate a weapon asset URL. */
  getWeaponAssetUrl(weaponId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.getAssetUrl('weapons', weaponId, type);
  }

  /** Generate an equipment asset URL. */
  getEquipmentAssetUrl(equipmentId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.getAssetUrl('equipment', equipmentId, type);
  }

  /** Generate a vehicle asset URL. */
  getVehicleAssetUrl(vehicleId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.getAssetUrl('vehicles', vehicleId, type);
  }

  getAssetStats(): {
    totalItems: number;
    totalVehicles: number;
    totalMaps: number;
    categoryCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};

    for (const itemId of ITEM_IDS) {
      const category = categorizeItem(itemId);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    return {
      totalItems: ITEM_IDS.length,
      totalVehicles: VEHICLE_IDS.length,
      totalMaps: MAP_ENTRIES.length,
      categoryCounts,
    };
  }

  private lookup<T>(
    id: string,
    { assetType, dictionary, cache, enrich }: AssetLookup<T>
  ): T | null {
    if (!id || typeof id !== 'string') {
      throw new PubgAssetError(`Invalid ${assetType} ID provided`, id || 'undefined', assetType, {
        operation: `get_${assetType}_info`,
        metadata: { providedId: id },
      });
    }

    const cached = cache.get(id);
    if (cached) {
      return { ...cached };
    }

    const name = dictionaryName(dictionary, id);
    if (name === undefined) {
      return null;
    }

    const info = enrich(id, name);
    cache.set(id, info);
    return { ...info };
  }
}
