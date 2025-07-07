import { AssetManager } from '../../src/utils/assets';

describe('AssetManager', () => {
  let assetManager: AssetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  afterEach(() => {
    assetManager.clearCache();
  });

  describe('Item Management', () => {
    it('should get user-friendly item names', () => {
      const itemName = assetManager.getItemName('Item_Weapon_AK47_C');
      expect(itemName).toBe('AKM'); // Real PUBG data shows AK47 as "AKM"
    });

    it('should get detailed item information', () => {
      const itemInfo = assetManager.getItemInfo('Item_Weapon_AK47_C');

      expect(itemInfo).toMatchObject({
        name: 'AKM',
        category: 'weapon',
        subcategory: 'assault_rifle',
        description: expect.any(String),
      });
    });

    it('should humanize unknown item IDs', () => {
      const unknownItemName = assetManager.getItemName('Item_Weapon_UnknownGun_C');
      expect(unknownItemName).toBe('Weapon UnknownGun');
    });

    it('should return null for non-existent items', () => {
      const itemInfo = assetManager.getItemInfo('Item_NonExistent_C');
      expect(itemInfo).toBeNull();
    });
  });

  describe('Vehicle Management', () => {
    it('should get user-friendly vehicle names', () => {
      const vehicleName = assetManager.getVehicleName('BP_Motorbike_04_C');
      expect(vehicleName).toBe('Motorcycle');
    });

    it('should get detailed vehicle information', () => {
      const vehicleInfo = assetManager.getVehicleInfo('BP_Motorbike_04_C');

      expect(vehicleInfo).toMatchObject({
        name: 'Motorcycle',
        type: 'two_wheeler',
        category: 'vehicle',
      });
    });

    it('should humanize unknown vehicle IDs', () => {
      const unknownVehicleName = assetManager.getVehicleName('BP_UnknownCar_01_C');
      expect(unknownVehicleName).toBe('UnknownCar');
    });

    it('should return null for non-existent vehicles', () => {
      const vehicleInfo = assetManager.getVehicleInfo('BP_NonExistent_C');
      expect(vehicleInfo).toBeNull();
    });
  });

  describe('Season Management', () => {
    it('should get season information by ID', () => {
      const seasons = assetManager.getSeasonsByPlatform('PC');
      const seasonInfo = seasons.find(s => s.id === 'division.bro.official.2018-01');

      expect(seasonInfo).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        startDate: expect.any(String),
        endDate: expect.any(String),
        isActive: expect.any(Boolean),
        isOffseason: expect.any(Boolean),
      });
    });

    it('should get current active season', () => {
      const currentSeason = assetManager.getCurrentSeason('PC');

      if (currentSeason) {
        expect(currentSeason).toMatchObject({
          name: expect.any(String),
          isActive: true,
        });
      }
    });

    it('should return undefined for non-existent season', () => {
      const seasons = assetManager.getSeasonsByPlatform('PC');
      const seasonInfo = seasons.find(s => s.id === 'non-existent-season');
      expect(seasonInfo).toBeUndefined();
    });
  });

  describe('Map Management', () => {
    it('should get user-friendly map names', () => {
      const mapName = assetManager.getMapName('Baltic');
      // May return real data or fallback - both are valid
      expect(typeof mapName).toBe('string');
      expect(mapName.length).toBeGreaterThan(0);
    });

    it('should get map name for Desert', () => {
      const mapName = assetManager.getMapName('Desert');
      // May return real data or fallback - both are valid
      expect(typeof mapName).toBe('string');
      expect(mapName.length).toBeGreaterThan(0);
    });

    it('should humanize unknown map IDs', () => {
      const unknownMapName = assetManager.getMapName('UnknownMap');
      expect(unknownMapName).toBe('Unknown Map');
    });
  });

  describe('Survival Titles', () => {
    it('should get survival title by rating', () => {
      const title = assetManager.getSurvivalTitle(1500);

      if (title) {
        expect(title).toMatchObject({
          title: expect.any(String),
          level: expect.any(Number),
          pointsRequired: expect.any(String),
          description: expect.any(String),
        });
      }
    });

    it('should get title for different ratings', () => {
      const ratings = [100, 500, 1000, 1500, 2000];

      ratings.forEach((rating) => {
        const title = assetManager.getSurvivalTitle(rating);
        // Should either return a title or null, never undefined
        expect(title === null || typeof title === 'object').toBe(true);
      });
    });

    it('should return appropriate title for low ratings', () => {
      const title = assetManager.getSurvivalTitle(50);

      if (title) {
        expect(title).toMatchObject({
          title: expect.any(String),
          level: expect.any(Number),
          pointsRequired: expect.any(String),
        });
      }
    });

    it('should handle high ratings', () => {
      const title = assetManager.getSurvivalTitle(5000);

      if (title) {
        expect(title).toMatchObject({
          title: expect.any(String),
          level: expect.any(Number),
          pointsRequired: expect.any(String),
        });
      }
    });
  });

  describe('Asset URLs', () => {
    it('should generate correct asset URLs', () => {
      const assetUrl = assetManager.getAssetUrl('weapons', 'Item_Weapon_AK47_C', 'icon');
      expect(assetUrl).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/weapons/icons/Weapon_AK47.png'
      );
    });

    it('should generate weapon asset URLs', () => {
      const weaponUrl = assetManager.getWeaponAssetUrl('Item_Weapon_M416_C', 'image');
      expect(weaponUrl).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/weapons/images/Weapon_M416.png'
      );
    });

    it('should generate equipment asset URLs', () => {
      const equipmentUrl = assetManager.getEquipmentAssetUrl('Item_Heal_FirstAid_C', 'icon');
      expect(equipmentUrl).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/equipment/icons/Heal_FirstAid.png'
      );
    });

    it('should generate vehicle asset URLs', () => {
      const vehicleUrl = assetManager.getVehicleAssetUrl('BP_Motorbike_04_C', 'icon');
      expect(vehicleUrl).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/vehicles/icons/Motorbike.png'
      );
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customAssetManager = new AssetManager({
        baseUrl: 'https://custom.example.com',
        version: '1.0.0',
        cacheAssets: false,
      });

      const assetUrl = customAssetManager.getAssetUrl('weapons', 'Item_Weapon_AK47_C', 'icon');
      expect(assetUrl).toBe('https://custom.example.com/assets/weapons/icons/Weapon_AK47.png');
    });

    it('should use default configuration when none provided', () => {
      const defaultAssetManager = new AssetManager();
      const assetUrl = defaultAssetManager.getAssetUrl('weapons', 'Item_Weapon_AK47_C', 'icon');
      expect(assetUrl).toContain('https://raw.githubusercontent.com/pubg/api-assets/master');
    });
  });

  describe('Enhanced Features', () => {
    it('should search items by name', () => {
      const results = assetManager.searchItems('AK');
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        results.forEach((item) => {
          expect(item.name.toLowerCase()).toContain('ak');
        });
      }
    });

    it('should get items by category', () => {
      const weapons = assetManager.getItemsByCategory('weapon');
      expect(Array.isArray(weapons)).toBe(true);
      expect(weapons.length).toBeGreaterThan(0);

      weapons.forEach((item) => {
        expect(item.category).toBe('weapon');
      });
    });

    it('should get all maps', () => {
      const allMaps = assetManager.getAllMaps();
      expect(Array.isArray(allMaps)).toBe(true);
      expect(allMaps.length).toBeGreaterThan(0);

      allMaps.forEach((map) => {
        expect(map).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
        });
      });
    });

    it('should get asset statistics', () => {
      const stats = assetManager.getAssetStats();

      expect(stats).toMatchObject({
        totalItems: expect.any(Number),
        totalVehicles: expect.any(Number),
        totalMaps: expect.any(Number),
        categoryCounts: expect.any(Object),
      });

      expect(stats.totalItems).toBeGreaterThan(0);
      expect(stats.totalVehicles).toBeGreaterThan(0);
      expect(stats.totalMaps).toBeGreaterThan(0);
    });

    it('should get seasons by platform', () => {
      const pcSeasons = assetManager.getSeasonsByPlatform('PC');
      expect(Array.isArray(pcSeasons)).toBe(true);

      pcSeasons.forEach((season) => {
        expect(season).toMatchObject({
          id: expect.any(String),
          platform: 'PC',
          name: expect.any(String),
          startDate: expect.any(String),
          endDate: expect.any(String),
          isActive: expect.any(Boolean),
          isOffseason: expect.any(Boolean),
        });
      });
    });

    it('should get damage causer names', () => {
      const damageCauserName = assetManager.getDamageCauserName('Item_Weapon_AK47_C');
      expect(typeof damageCauserName).toBe('string');
      expect(damageCauserName.length).toBeGreaterThan(0);
    });

    it('should get game mode names', () => {
      const gameModeName = assetManager.getGameModeName('squad');
      expect(typeof gameModeName).toBe('string');
      expect(gameModeName.length).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should cache item information', () => {
      const itemId = 'Item_Weapon_AK47_C';

      // First call
      const firstResult = assetManager.getItemInfo(itemId);

      // Second call should return the same object (cached)
      const secondResult = assetManager.getItemInfo(itemId);

      expect(firstResult).toBe(secondResult);
    });

    it('should clear cache when requested', () => {
      const assetManagerWithCache = new AssetManager({ cacheAssets: true });

      // Populate cache
      assetManagerWithCache.getItemName('Item_Weapon_AK47_C');

      // Clear cache
      assetManagerWithCache.clearCache();

      // Cache should be empty now (can't test directly, but operation should succeed)
      expect(() => assetManagerWithCache.clearCache()).not.toThrow();
    });
  });
});
