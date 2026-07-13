import damageCauserNameData from '../../assets/dictionaries/damage-causer-name.json';
import damageTypeCategoryData from '../../assets/dictionaries/damage-type-category.json';
import gameModeData from '../../assets/dictionaries/game-mode.json';
import itemIdData from '../../assets/dictionaries/item-id.json';
import mapNameData from '../../assets/dictionaries/map-name.json';
import vehicleIdData from '../../assets/dictionaries/vehicle-id.json';
import seasonsData from '../../assets/seasons.json';
import survivalTitlesData from '../../assets/survival-titles.json';
import { PubgAssetError, PubgConfigurationError } from '../../errors';
import type { Platform } from '../../types/assets/seasons';
import {
  buildAssetUrl,
  categorizeItem,
  categorizeVehicle,
  humanizeItemId,
  humanizeMapId,
  humanizeSeasonId,
  humanizeVehicleId,
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
  isActive: boolean;
  isOffseason: boolean;
}

export interface SurvivalTitleInfo {
  title: string;
  level: number;
  pointsRequired: string;
  description?: string;
}

const DEFAULT_CONFIG: Required<AssetCatalogConfig> = {
  assetBaseUrl: 'https://raw.githubusercontent.com/pubg/api-assets/master',
};

const VALID_PLATFORMS: Platform[] = ['PC', 'XBOX', 'PS4', 'Stadia'];
const ITEM_IDS = Object.keys(itemIdData);
const VEHICLE_IDS = Object.keys(vehicleIdData);
const MAP_ENTRIES = Object.entries(mapNameData as Record<string, string>);

export class AssetCatalog {
  private readonly config: Required<AssetCatalogConfig>;
  private readonly itemCache: Map<string, EnhancedItemInfo> = new Map();
  private readonly vehicleCache: Map<string, EnhancedVehicleInfo> = new Map();
  private readonly seasonCache: Map<string, EnhancedSeasonInfo[]> = new Map();
  private readonly itemSearchIndex: ItemSearchIndex<EnhancedItemInfo>;

  constructor(config: AssetCatalogConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const allItems = ITEM_IDS.map((id) => this.getItemInfo(id)!);
    this.itemSearchIndex = createItemSearchIndex(allItems);
  }

  getItemName(itemId: string): string {
    return (itemIdData as Record<string, string>)[itemId] || humanizeItemId(itemId);
  }

  getItemInfo(itemId: string): EnhancedItemInfo | null {
    if (!itemId || typeof itemId !== 'string') {
      throw new PubgAssetError('Invalid item ID provided', itemId || 'undefined', 'item', {
        operation: 'get_item_info',
        metadata: { providedId: itemId },
      });
    }

    if (this.itemCache.has(itemId)) {
      return this.itemCache.get(itemId)!;
    }

    const name = this.getItemName(itemId);
    if (name === humanizeItemId(itemId) && !(itemId in itemIdData)) {
      return null;
    }

    const info: EnhancedItemInfo = {
      id: itemId,
      name,
      category: categorizeItem(itemId),
      subcategory: subcategorizeItem(itemId),
      description: name,
    };

    this.itemCache.set(itemId, info);
    return info;
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
    return searchItems(this.itemSearchIndex, query);
  }

  getVehicleName(vehicleId: string): string {
    return (vehicleIdData as Record<string, string>)[vehicleId] || humanizeVehicleId(vehicleId);
  }

  getVehicleInfo(vehicleId: string): EnhancedVehicleInfo | null {
    if (!vehicleId || typeof vehicleId !== 'string') {
      throw new PubgAssetError('Invalid vehicle ID provided', vehicleId || 'undefined', 'vehicle', {
        operation: 'get_vehicle_info',
        metadata: { providedId: vehicleId },
      });
    }

    if (this.vehicleCache.has(vehicleId)) {
      return this.vehicleCache.get(vehicleId)!;
    }

    const name = this.getVehicleName(vehicleId);
    if (name === humanizeVehicleId(vehicleId) && !(vehicleId in vehicleIdData)) {
      return null;
    }

    const info: EnhancedVehicleInfo = {
      id: vehicleId,
      name,
      type: categorizeVehicle(vehicleId),
      category: 'vehicle',
      description: name,
    };

    this.vehicleCache.set(vehicleId, info);
    return info;
  }

  getMapName(mapId: string): string {
    return (mapNameData as Record<string, string>)[mapId] || humanizeMapId(mapId);
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

    if (this.seasonCache.has(platform)) {
      return this.seasonCache.get(platform)!;
    }

    const platformSeasons = (seasonsData as any)[platform] || [];
    const enhancedSeasons: EnhancedSeasonInfo[] = platformSeasons.map((season: any) => ({
      id: season.id,
      platform,
      name: humanizeSeasonId(season.id),
      startDate: season.attributes.startDate,
      endDate: season.attributes.endDate,
      isActive: isSeasonActive(season.attributes.startDate, season.attributes.endDate),
      isOffseason: season.attributes.endDate === '00-00-0000',
    }));

    this.seasonCache.set(platform, enhancedSeasons);
    return enhancedSeasons;
  }

  getCurrentSeason(platform: Platform = 'PC'): EnhancedSeasonInfo | null {
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

    for (const [titleName, titleData] of Object.entries(survivalTitlesData as any)) {
      if (typeof titleData === 'object' && titleData !== null && (titleData as any).levels) {
        const levels = (titleData as any).levels;
        for (const levelInfo of levels) {
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
    }

    return null;
  }

  getDamageCauserName(causerId: string): string {
    return (damageCauserNameData as Record<string, string>)[causerId] || causerId;
  }

  getDamageTypeCategory(damageType: string): string {
    return (damageTypeCategoryData as Record<string, string>)[damageType] || damageType;
  }

  getGameModeName(gameModeId: string): string {
    return (gameModeData as Record<string, string>)[gameModeId] || gameModeId;
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
}
