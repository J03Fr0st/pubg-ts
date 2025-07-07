// Import the synced asset data and types
import Fuse from 'fuse.js';
import damageCauserNameData from '../assets/dictionaries/damage-causer-name.json';
import damageTypeCategoryData from '../assets/dictionaries/damage-type-category.json';
import gameModeData from '../assets/dictionaries/game-mode.json';
import itemIdData from '../assets/dictionaries/item-id.json';
import mapNameData from '../assets/dictionaries/map-name.json';
import vehicleIdData from '../assets/dictionaries/vehicle-id.json';
// Import the JSON files directly
import seasonsData from '../assets/seasons.json';
import survivalTitlesData from '../assets/survival-titles.json';
import {
  PubgAssetError,
  PubgCacheError,
  PubgConfigurationError,
  PubgValidationError,
} from '../errors';
import type { Platform } from '../types/assets/seasons';
import { logger } from './logger';

/**
 * Unified PUBG Asset Management System
 *
 * Provides comprehensive access to all PUBG assets with full TypeScript type safety.
 * Uses synced local data for zero-latency performance.
 *
 * ## Recommended Usage
 *
 * All methods are synchronous and use locally cached data for optimal performance:
 * - `getItemName()`, `getItemInfo()`, `searchItems()` - Item management
 * - `getVehicleName()`, `getVehicleInfo()` - Vehicle information
 * - `getMapName()`, `getAllMaps()` - Map data
 * - `getSeasonsByPlatform()`, `getCurrentSeason()` - Season information
 * - `getSurvivalTitle()` - Survival title lookups
 *
 * ## Migration from Async Methods
 *
 * Legacy async methods are deprecated in favor of synchronous alternatives:
 * - `getSeasonInfo()` → `getSeasonsByPlatform().find(s => s.id === seasonId)`
 * - `getSeasons()` → `getSeasonsByPlatform('PC')`
 *
 * @example
 * ```typescript
 * const assetManager = new AssetManager();
 *
 * // Get item information (synchronous)
 * const itemName = assetManager.getItemName('Item_Weapon_AK47_C');
 * const itemInfo = assetManager.getItemInfo('Item_Weapon_AK47_C');
 *
 * // Search items by category
 * const weapons = assetManager.getItemsByCategory('weapon');
 *
 * // Get season information
 * const pcSeasons = assetManager.getSeasonsByPlatform('PC');
 * const currentSeason = assetManager.getCurrentSeason('PC');
 * ```
 */

export interface AssetConfig {
  baseUrl?: string;
  version?: string;
  cacheAssets?: boolean;
  useLocalData?: boolean; // New option to prefer local data
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

// Legacy interfaces for backward compatibility
interface ItemDictionary {
  [key: string]: {
    name: string;
    category: string;
    subcategory?: string;
    description?: string;
  };
}

interface VehicleDictionary {
  [key: string]: {
    name: string;
    type: string;
    category: string;
    description?: string;
  };
}

interface SeasonInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isOffseason: boolean;
}

interface SurvivalTitle {
  tier: string;
  title: string;
  requiredRating: number;
  description?: string;
}

export class AssetManager {
  private config: AssetConfig;
  protected cache: Map<string, any> = new Map();
  private itemCache: Map<string, EnhancedItemInfo> = new Map();
  private vehicleCache: Map<string, EnhancedVehicleInfo> = new Map();
  private seasonCache: Map<string, EnhancedSeasonInfo[]> = new Map();
  private itemSearchIndex: Fuse<EnhancedItemInfo>;

  constructor(config: AssetConfig = {}) {
    this.validateConfig(config);

    this.config = {
      baseUrl: 'https://raw.githubusercontent.com/pubg/api-assets/master',
      version: 'latest',
      cacheAssets: true,
      useLocalData: true, // Default to using local synced data
      ...config,
    };

    // Build search indexes
    const allItems = Object.keys(itemIdData).map((id) => this.getItemInfo(id)!);
    this.itemSearchIndex = new Fuse(allItems, {
      keys: ['name', 'category', 'subcategory', 'description'],
      includeScore: true,
      threshold: 0.4,
    });

    logger.client('AssetManager initialized with search indexes', {
      config: this.config,
      usingLocalData: this.config.useLocalData,
    });
  }

  /**
   * Get user-friendly item name with type safety
   */
  getItemName(itemId: string): string {
    if (this.config.useLocalData) {
      return (itemIdData as Record<string, string>)[itemId] || this.humanizeItemId(itemId);
    }
    // Legacy network fallback - would need async version
    return this.humanizeItemId(itemId);
  }

  /**
   * Get detailed item information with enhanced metadata
   */
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
    if (name === this.humanizeItemId(itemId) && !(itemId in itemIdData)) {
      return null; // Item doesn't exist in official data
    }

    const info: EnhancedItemInfo = {
      id: itemId,
      name,
      category: this.categorizeItem(itemId),
      subcategory: this.subcategorizeItem(itemId),
      description: name,
    };

    this.itemCache.set(itemId, info);
    return info;
  }

  /**
   * Get all items by category with type safety
   */
  getItemsByCategory(category: string): EnhancedItemInfo[] {
    const items: EnhancedItemInfo[] = [];

    for (const itemId of Object.keys(itemIdData)) {
      const info = this.getItemInfo(itemId);
      if (info && info.category === category) {
        items.push(info);
      }
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search items by name using fuzzy search.
   * @param query The search query.
   * @returns An array of item information, sorted by relevance.
   */
  searchItems(query: string): EnhancedItemInfo[] {
    if (query.length < 2) {
      return [];
    }

    const results = this.itemSearchIndex.search(query);
    return results.map((result) => result.item);
  }

  /**
   * Get user-friendly vehicle name with type safety
   */
  getVehicleName(vehicleId: string): string {
    if (this.config.useLocalData) {
      return (
        (vehicleIdData as Record<string, string>)[vehicleId] || this.humanizeVehicleId(vehicleId)
      );
    }
    return this.humanizeVehicleId(vehicleId);
  }

  /**
   * Get detailed vehicle information
   */
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
    if (name === this.humanizeVehicleId(vehicleId) && !(vehicleId in vehicleIdData)) {
      return null;
    }

    const info: EnhancedVehicleInfo = {
      id: vehicleId,
      name,
      type: this.categorizeVehicle(vehicleId),
      category: 'vehicle',
      description: name,
    };

    this.vehicleCache.set(vehicleId, info);
    return info;
  }

  /**
   * Get user-friendly map name with type safety
   */
  getMapName(mapId: string): string {
    if (this.config.useLocalData) {
      return (mapNameData as Record<string, string>)[mapId] || this.humanizeMapId(mapId);
    }
    return this.humanizeMapId(mapId);
  }

  /**
   * Get all available maps
   */
  getAllMaps(): Array<{ id: string; name: string }> {
    return Object.entries(mapNameData as Record<string, string>).map(([id, name]) => ({
      id,
      name,
    }));
  }

  /**
   * Get season information by platform
   */
  getSeasonsByPlatform(platform: Platform): EnhancedSeasonInfo[] {
    const validPlatforms: Platform[] = ['PC', 'XBOX', 'PS4', 'Stadia'];

    if (!validPlatforms.includes(platform)) {
      throw new PubgConfigurationError(
        `Invalid platform '${platform}'. Valid platforms are: ${validPlatforms.join(', ')}`,
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
      name: this.humanizeSeasonId(season.id),
      startDate: season.attributes.startDate,
      endDate: season.attributes.endDate,
      isActive: this.isSeasonActive(season.attributes.startDate, season.attributes.endDate),
      isOffseason: season.attributes.endDate === '00-00-0000',
    }));

    this.seasonCache.set(platform, enhancedSeasons);
    return enhancedSeasons;
  }

  /**
   * Get current active season for a platform
   */
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
    return seasons.find((s) => s.isActive) || null;
  }

  /**
   * Get survival title information
   */
  getSurvivalTitle(rating: number): SurvivalTitleInfo | null {
    if (typeof rating !== 'number' || rating < 0 || !Number.isFinite(rating)) {
      throw new PubgAssetError(
        'Invalid survival rating provided',
        String(rating),
        'survival_title',
        { operation: 'get_survival_title', metadata: { providedRating: rating } }
      );
    }

    const titles = survivalTitlesData as any;

    // Find the appropriate title based on rating
    for (const [titleName, titleData] of Object.entries(titles)) {
      if (typeof titleData === 'object' && titleData !== null && (titleData as any).levels) {
        const levels = (titleData as any).levels;
        for (const levelInfo of levels) {
          if (this.isRatingInRange(rating, levelInfo.survivalPoints)) {
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

  /**
   * Get damage causer name
   */
  getDamageCauserName(causerId: string): string {
    return (damageCauserNameData as Record<string, string>)[causerId] || causerId;
  }

  /**
   * Get damage type category
   */
  getDamageTypeCategory(damageType: string): string {
    return (damageTypeCategoryData as Record<string, string>)[damageType] || damageType;
  }

  /**
   * Get game mode name
   */
  getGameModeName(gameModeId: string): string {
    return (gameModeData as Record<string, string>)[gameModeId] || gameModeId;
  }

  // Legacy async methods for backward compatibility
  /**
   * @deprecated Use getSeasonsByPlatform('PC') for better performance with local data.
   * This method will be removed in v2.0.0.
   *
   * @example
   * // Instead of:
   * const seasons = await assetManager.getSeasons();
   *
   * // Use:
   * const seasons = assetManager.getSeasonsByPlatform('PC');
   */
  async getSeasons(): Promise<SeasonInfo[]> {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[DEPRECATION WARNING] AssetManager.getSeasons() is deprecated. ' +
          'Use getSeasonsByPlatform() for better performance with local data. ' +
          'This method will be removed in v2.0.0.'
      );
    }

    return this.getSeasonsByPlatform('PC');
  }

  /**
   * Get asset URL for items, weapons, vehicles, etc.
   */
  getAssetUrl(category: string, itemId: string, type: 'icon' | 'image' = 'icon'): string {
    const cleanId = this.cleanItemId(itemId);
    return `${this.config.baseUrl}/assets/${category}/${type}s/${cleanId}.png`;
  }

  /**
   * Get weapon asset URL with type safety
   */
  getWeaponAssetUrl(weaponId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.getAssetUrl('weapons', weaponId, type);
  }

  /**
   * Get equipment asset URL with type safety
   */
  getEquipmentAssetUrl(equipmentId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.getAssetUrl('equipment', equipmentId, type);
  }

  /**
   * Get vehicle asset URL with type safety
   */
  getVehicleAssetUrl(vehicleId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.getAssetUrl('vehicles', vehicleId, type);
  }

  /**
   * Get statistics about the asset data
   */
  getAssetStats(): {
    totalItems: number;
    totalVehicles: number;
    totalMaps: number;
    categoryCounts: Record<string, number>;
  } {
    const items = Object.keys(itemIdData);
    const categoryCounts: Record<string, number> = {};

    for (const itemId of items) {
      const category = this.categorizeItem(itemId);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    return {
      totalItems: items.length,
      totalVehicles: Object.keys(vehicleIdData).length,
      totalMaps: Object.keys(mapNameData).length,
      categoryCounts,
    };
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    try {
      this.cache.clear();
      this.itemCache.clear();
      this.vehicleCache.clear();
      this.seasonCache.clear();
      logger.cache('All asset caches cleared');
    } catch (error) {
      throw new PubgCacheError('Failed to clear asset caches', 'all_caches', 'cleanup', {
        metadata: { originalError: error },
      });
    }
  }

  // Private helper methods
  private categorizeItem(itemId: string): string {
    if (itemId.includes('Weapon')) return 'weapon';
    if (itemId.includes('Heal') || itemId.includes('Boost')) return 'consumable';
    if (itemId.includes('Attach')) return 'attachment';
    if (itemId.includes('Armor') || itemId.includes('Back')) return 'equipment';
    if (itemId.includes('Ammo')) return 'ammunition';
    return 'other';
  }

  private subcategorizeItem(itemId: string): string {
    // Weapons
    if (
      itemId.includes('AR') ||
      itemId.includes('AK') ||
      itemId.includes('M416') ||
      itemId.includes('SCAR')
    )
      return 'assault_rifle';
    if (itemId.includes('SMG') || itemId.includes('UMP') || itemId.includes('Vector')) return 'smg';
    if (itemId.includes('SR') || itemId.includes('Kar98') || itemId.includes('AWM'))
      return 'sniper_rifle';
    if (itemId.includes('Shotgun') || itemId.includes('S686') || itemId.includes('S1897'))
      return 'shotgun';
    if (itemId.includes('Pistol') || itemId.includes('P92') || itemId.includes('P1911'))
      return 'pistol';

    // Healing
    if (itemId.includes('Bandage')) return 'healing';
    if (itemId.includes('FirstAid')) return 'healing';
    if (itemId.includes('MedKit')) return 'healing';
    if (itemId.includes('Drink') || itemId.includes('Pill')) return 'boost';

    // Attachments
    if (itemId.includes('Upper')) return 'sight';
    if (itemId.includes('Lower')) return 'grip';
    if (itemId.includes('Muzzle')) return 'muzzle';
    if (itemId.includes('Magazine')) return 'magazine';

    return 'general';
  }

  private categorizeVehicle(vehicleId: string): string {
    if (vehicleId.includes('Motorbike') || vehicleId.includes('Motorcycle')) return 'two_wheeler';
    if (vehicleId.includes('Car') || vehicleId.includes('Pickup') || vehicleId.includes('Van'))
      return 'four_wheeler';
    if (vehicleId.includes('Boat') || vehicleId.includes('Ship')) return 'watercraft';
    if (vehicleId.includes('Plane') || vehicleId.includes('Glider')) return 'aircraft';
    return 'unknown';
  }

  private humanizeItemId(itemId: string): string {
    return itemId
      .replace(/^Item_/, '')
      .replace(/_C$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private humanizeVehicleId(vehicleId: string): string {
    return vehicleId
      .replace(/^BP_/, '')
      .replace(/_\d+_C$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private humanizeMapId(mapId: string): string {
    return mapId.replace(/([A-Z])/g, ' $1').trim();
  }

  private humanizeSeasonId(seasonId: string): string {
    // Extract season info from ID like "division.bro.official.pc-2018-01"
    const parts = seasonId.split('.');
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/(\w+)-(\d{4})-(\d{2})/);

    if (match) {
      const [, platform, year, season] = match;
      return `${platform.toUpperCase()} Season ${parseInt(season)} (${year})`;
    }

    return seasonId;
  }

  private isSeasonActive(startDate: string, endDate: string): boolean {
    if (endDate === '00-00-0000') return true; // Ongoing season

    const now = new Date();
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    return start <= now && now <= end;
  }

  protected parseDate(dateStr: string): Date {
    if (!dateStr || typeof dateStr !== 'string') {
      throw new PubgValidationError('Invalid date string provided', {
        operation: 'parse_date',
        metadata: { providedDate: dateStr },
      });
    }

    // Handle MM-DD-YYYY format
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      throw new PubgValidationError(
        `Invalid date format '${dateStr}'. Expected MM-DD-YYYY format`,
        { operation: 'parse_date', metadata: { providedDate: dateStr, format: 'MM-DD-YYYY' } }
      );
    }

    const [month, day, year] = parts.map(Number);
    if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) {
      throw new PubgValidationError(
        `Invalid date components in '${dateStr}'. All parts must be numeric`,
        { operation: 'parse_date', metadata: { month, day, year } }
      );
    }

    return new Date(year, month - 1, day);
  }

  private isRatingInRange(rating: number, range: string | number): boolean {
    const rangeStr = String(range);

    if (rangeStr.includes('+')) {
      const minRating = parseInt(rangeStr.replace('+', ''));
      return rating >= minRating;
    }

    if (rangeStr.includes('-')) {
      const [min, max] = rangeStr.split('-').map(Number);
      return rating >= min && rating <= max;
    }

    // Handle exact number matches
    const exactNumber = parseInt(rangeStr);
    if (!Number.isNaN(exactNumber)) {
      return rating === exactNumber;
    }

    return false;
  }

  private cleanItemId(itemId: string): string {
    return itemId
      .replace(/^Item_/, '')
      .replace(/^BP_/, '')
      .replace(/_\d+_C$/, '')
      .replace(/_C$/, '');
  }

  /**
   * Validate configuration object
   */
  private validateConfig(config: AssetConfig): void {
    if (config.baseUrl && typeof config.baseUrl !== 'string') {
      throw new PubgConfigurationError(
        'baseUrl must be a string',
        'baseUrl',
        'string',
        config.baseUrl
      );
    }

    if (config.version && typeof config.version !== 'string') {
      throw new PubgConfigurationError(
        'version must be a string',
        'version',
        'string',
        config.version
      );
    }

    if (config.cacheAssets !== undefined && typeof config.cacheAssets !== 'boolean') {
      throw new PubgConfigurationError(
        'cacheAssets must be a boolean',
        'cacheAssets',
        'boolean',
        config.cacheAssets
      );
    }

    if (config.useLocalData !== undefined && typeof config.useLocalData !== 'boolean') {
      throw new PubgConfigurationError(
        'useLocalData must be a boolean',
        'useLocalData',
        'boolean',
        config.useLocalData
      );
    }
  }
}

// Export a default instance
export const assetManager = new AssetManager();
