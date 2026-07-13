import { PubgConfigurationError } from '../../src/errors';
import { AssetCatalog, type AssetCatalogConfig } from '../../src/utils/assets/catalog';

describe('AssetCatalog', () => {
  let catalog: AssetCatalog;

  beforeEach(() => {
    catalog = new AssetCatalog();
  });

  describe('items', () => {
    it('uses local dictionary names and item category policy', () => {
      const item = catalog.getItemInfo('Item_Weapon_AK47_C');

      expect(item).toMatchObject({
        id: 'Item_Weapon_AK47_C',
        name: 'AKM',
        category: 'weapon',
        subcategory: 'assault_rifle',
      });
    });

    it('returns sorted items by category', () => {
      const weapons = catalog.getItemsByCategory('weapon');

      expect(weapons.length).toBeGreaterThan(0);
      expect(weapons.every((item) => item.category === 'weapon')).toBe(true);
      expect(weapons).toEqual([...weapons].sort((a, b) => a.name.localeCompare(b.name)));
    });

    it('searches indexed item metadata and ignores one-character queries', () => {
      expect(catalog.searchItems('A')).toEqual([]);

      const results = catalog.searchItems('AK');

      expect(results.some((item) => item.id === 'Item_Weapon_AK47_C')).toBe(true);
    });
  });

  describe('vehicles and maps', () => {
    it('uses local dictionary names and vehicle category policy', () => {
      expect(catalog.getVehicleInfo('BP_Motorbike_04_C')).toMatchObject({
        id: 'BP_Motorbike_04_C',
        name: 'Motorcycle',
        type: 'two_wheeler',
        category: 'vehicle',
      });
    });

    it('returns all map dictionary entries', () => {
      const maps = catalog.getAllMaps();

      expect(maps).toContainEqual({ id: 'Desert_Main', name: 'Miramar' });
    });
  });

  describe('seasons and survival titles', () => {
    it('parses enhanced seasons for a valid platform', () => {
      const seasons = catalog.getSeasonsByPlatform('PC');

      expect(seasons[0]).toMatchObject({
        id: 'division.bro.official.2018-01',
        platform: 'PC',
        name: 'division.bro.official.2018-01',
        startDate: '12-21-2017',
        endDate: '01-31-2018',
        isActive: expect.any(Boolean),
        isOffseason: false,
      });
    });

    it('keeps platform validation in the catalog', () => {
      expect(() => catalog.getSeasonsByPlatform('INVALID' as any)).toThrow(PubgConfigurationError);
    });

    it('matches survival titles by rating range', () => {
      expect(catalog.getSurvivalTitle(1000)).toMatchObject({
        title: 'NOVICE',
        level: 5,
        pointsRequired: '1000-1199',
      });
    });
  });

  describe('asset URLs and cache', () => {
    it('normalizes item and vehicle ids for asset URLs', () => {
      expect(catalog.getAssetUrl('weapons', 'Item_Weapon_AK47_C')).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/weapons/icons/Weapon_AK47.png'
      );
      expect(catalog.getAssetUrl('vehicles', 'BP_Motorbike_04_C')).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/vehicles/icons/Motorbike.png'
      );
    });

    it('uses assetBaseUrl only for generated URLs', () => {
      const customCatalog = new AssetCatalog({
        assetBaseUrl: 'https://cdn.example.test/pubg',
      });

      expect(customCatalog.getWeaponAssetUrl('Item_Weapon_AK47_C', 'icon')).toBe(
        'https://cdn.example.test/pubg/assets/weapons/icons/Weapon_AK47.png'
      );
      expect(customCatalog.getItemName('Item_Weapon_AK47_C')).toBe('AKM');
    });

    it('does not expose public cache clearing', () => {
      expect('clearCache' in new AssetCatalog()).toBe(false);
    });
  });
});

const validConfig: AssetCatalogConfig = { assetBaseUrl: 'https://cdn.example.test/pubg' };
void validConfig;

// @ts-expect-error v2 has no remote catalog version
const versionConfig: AssetCatalogConfig = { version: 'latest' };
// @ts-expect-error v2 derived caches are not caller-configurable
const cacheConfig: AssetCatalogConfig = { cacheAssets: false };
// @ts-expect-error v2 catalog data is always local
const localDataConfig: AssetCatalogConfig = { useLocalData: false };
void [versionConfig, cacheConfig, localDataConfig];
