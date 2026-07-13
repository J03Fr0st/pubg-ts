import { PubgCacheError, PubgConfigurationError } from '../errors';
import type { Platform } from '../types/assets/seasons';
import {
  AssetCatalog,
  type EnhancedItemInfo,
  type EnhancedSeasonInfo,
  type EnhancedVehicleInfo,
  type SurvivalTitleInfo,
} from './assets/catalog';
import { parseDate } from './assets/normalization';
import { logger } from './logger';

/**
 * Unified PUBG Asset Management System
 *
 * Provides comprehensive access to all PUBG assets with full TypeScript type safety.
 * Uses synced local data for zero-latency performance.
 */
export type {
  EnhancedItemInfo,
  EnhancedSeasonInfo,
  EnhancedVehicleInfo,
  SurvivalTitleInfo,
} from './assets/catalog';

/** Legacy AssetManager configuration retained until the v2 facade is removed. */
export interface AssetConfig {
  /** Base URL used when generating asset image URLs. */
  baseUrl?: string;
  /** Legacy catalog version setting retained for facade compatibility. */
  version?: string;
  /** Legacy cache setting retained for facade compatibility. */
  cacheAssets?: boolean;
  /** Legacy local-data setting retained for facade compatibility. */
  useLocalData?: boolean;
}

interface SeasonInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isOffseason: boolean;
}

export class AssetManager {
  protected cache: Map<string, any> = new Map();
  private catalog: AssetCatalog;

  constructor(config: AssetConfig = {}) {
    validateConfig(config);

    const resolvedConfig = {
      baseUrl: 'https://raw.githubusercontent.com/pubg/api-assets/master',
      version: 'latest',
      cacheAssets: true,
      useLocalData: true,
      ...config,
    };
    this.catalog = new AssetCatalog({ assetBaseUrl: resolvedConfig.baseUrl });

    logger.client('AssetManager initialized with asset catalog', {
      config: resolvedConfig,
      usingLocalData: resolvedConfig.useLocalData,
    });
  }

  /**
   * Get user-friendly item name with type safety
   */
  getItemName(itemId: string): string {
    return this.catalog.getItemName(itemId);
  }

  /**
   * Get detailed item information with enhanced metadata
   */
  getItemInfo(itemId: string): EnhancedItemInfo | null {
    return this.catalog.getItemInfo(itemId);
  }

  /**
   * Get all items by category with type safety
   */
  getItemsByCategory(category: string): EnhancedItemInfo[] {
    return this.catalog.getItemsByCategory(category);
  }

  /**
   * Search items by name using fuzzy search.
   * @param query The search query.
   * @returns An array of item information, sorted by relevance.
   */
  searchItems(query: string): EnhancedItemInfo[] {
    return this.catalog.searchItems(query);
  }

  /**
   * Get user-friendly vehicle name with type safety
   */
  getVehicleName(vehicleId: string): string {
    return this.catalog.getVehicleName(vehicleId);
  }

  /**
   * Get detailed vehicle information
   */
  getVehicleInfo(vehicleId: string): EnhancedVehicleInfo | null {
    return this.catalog.getVehicleInfo(vehicleId);
  }

  /**
   * Get user-friendly map name with type safety
   */
  getMapName(mapId: string): string {
    return this.catalog.getMapName(mapId);
  }

  /**
   * Get all available maps
   */
  getAllMaps(): Array<{ id: string; name: string }> {
    return this.catalog.getAllMaps();
  }

  /**
   * Get season information by platform
   */
  getSeasonsByPlatform(platform: Platform): EnhancedSeasonInfo[] {
    return this.catalog.getSeasonsByPlatform(platform);
  }

  /**
   * Get current active season for a platform
   */
  getCurrentSeason(platform: Platform = 'PC'): EnhancedSeasonInfo | null {
    return this.catalog.getCurrentSeason(platform);
  }

  /**
   * Get survival title information
   */
  getSurvivalTitle(rating: number): SurvivalTitleInfo | null {
    return this.catalog.getSurvivalTitle(rating);
  }

  /**
   * Get damage causer name
   */
  getDamageCauserName(causerId: string): string {
    return this.catalog.getDamageCauserName(causerId);
  }

  /**
   * Get damage type category
   */
  getDamageTypeCategory(damageType: string): string {
    return this.catalog.getDamageTypeCategory(damageType);
  }

  /**
   * Get game mode name
   */
  getGameModeName(gameModeId: string): string {
    return this.catalog.getGameModeName(gameModeId);
  }

  /**
   * @deprecated Use getSeasonsByPlatform('PC') for better performance with local data.
   * This method will be removed in v2.0.0.
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
    return this.catalog.getAssetUrl(category, itemId, type);
  }

  /**
   * Get weapon asset URL with type safety
   */
  getWeaponAssetUrl(weaponId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.catalog.getWeaponAssetUrl(weaponId, type);
  }

  /**
   * Get equipment asset URL with type safety
   */
  getEquipmentAssetUrl(equipmentId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.catalog.getEquipmentAssetUrl(equipmentId, type);
  }

  /**
   * Get vehicle asset URL with type safety
   */
  getVehicleAssetUrl(vehicleId: string, type: 'icon' | 'image' = 'icon'): string {
    return this.catalog.getVehicleAssetUrl(vehicleId, type);
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
    return this.catalog.getAssetStats();
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    try {
      this.cache.clear();
      logger.cache('All asset caches cleared');
    } catch (error) {
      throw new PubgCacheError('Failed to clear asset caches', 'all_caches', 'cleanup', {
        metadata: { originalError: error },
      });
    }
  }

  protected parseDate(dateStr: string): Date {
    return parseDate(dateStr);
  }
}

/**
 * Validate configuration object
 */
function validateConfig(config: AssetConfig): void {
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

export const assetManager = new AssetManager();
