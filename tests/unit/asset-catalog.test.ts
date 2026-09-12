import { PubgAssetError, PubgConfigurationError } from '../../src/errors';
import { AssetCatalog } from '../../src/utils/assets/catalog';

describe('AssetCatalog', () => {
  let catalog: AssetCatalog;

  beforeEach(() => {
    catalog = new AssetCatalog();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('items', () => {
    it.each([
      'toString',
      'constructor',
      '__proto__',
    ])('treats inherited key %s as unknown', (id) => {
      expect(catalog.getItemInfo(id)).toBeNull();
      expect(catalog.getVehicleInfo(id)).toBeNull();
      for (const name of [
        catalog.getItemName(id),
        catalog.getVehicleName(id),
        catalog.getMapName(id),
        catalog.getDamageCauserName(id),
        catalog.getDamageTypeCategory(id),
        catalog.getGameModeName(id),
      ]) {
        expect(typeof name).toBe('string');
      }
    });

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

    it('humanizes unknown item ids and returns null for unknown item metadata', () => {
      expect(catalog.getItemName('Item_Weapon_UnknownGun_C')).toBe('Weapon UnknownGun');
      expect(catalog.getItemInfo('Item_NonExistent_C')).toBeNull();
    });

    it('rejects invalid item ids with asset context', () => {
      expect(() => catalog.getItemInfo(null as any)).toThrow(PubgAssetError);

      try {
        catalog.getItemInfo(null as any);
      } catch (error) {
        expect(error).toBeInstanceOf(PubgAssetError);
        expect((error as PubgAssetError).assetType).toBe('item');
        expect((error as PubgAssetError).context.metadata).toMatchObject({ providedId: null });
      }
    });

    it('returns caller-owned item metadata', () => {
      const first = catalog.getItemInfo('Item_Weapon_AK47_C');
      expect(first).not.toBeNull();
      first!.name = 'Edited by caller';
      first!.category = 'edited';
      expect(catalog.getItemInfo('Item_Weapon_AK47_C')).toMatchObject({
        name: 'AKM',
        category: 'weapon',
      });
      expect(catalog.getItemName('Item_Weapon_AK47_C')).toBe('AKM');
    });

    it.each(['category', 'search'])('isolates edits to %s results', (source) => {
      const results =
        source === 'category' ? catalog.getItemsByCategory('weapon') : catalog.searchItems('AKM');
      const item = results.find((entry) => entry.id === 'Item_Weapon_AK47_C')!;
      expect(item).toBeDefined();
      item.name = 'Edited by caller';
      item.category = 'edited';
      expect(catalog.getItemInfo(item.id)).toMatchObject({ name: 'AKM', category: 'weapon' });
      expect(catalog.searchItems('AKM')).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: item.id, name: 'AKM' })])
      );
      expect(catalog.getItemsByCategory('weapon')).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: item.id, name: 'AKM' })])
      );
    });

    it('returns caller-owned vehicle metadata', () => {
      const vehicle = catalog.getVehicleInfo('BP_Motorbike_04_C')!;
      vehicle.name = 'Edited by caller';
      expect(catalog.getVehicleInfo(vehicle.id)?.name).toBe('Motorcycle');
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

    it('humanizes unknown vehicle and map ids', () => {
      expect(catalog.getVehicleName('BP_UnknownCar_01_C')).toBe('UnknownCar');
      expect(catalog.getVehicleInfo('BP_NonExistent_C')).toBeNull();
      expect(catalog.getMapName('UnknownMap')).toBe('Unknown Map');
    });

    it('rejects invalid vehicle ids', () => {
      expect(() => catalog.getVehicleInfo(undefined as any)).toThrow(PubgAssetError);
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

    it('recomputes season activity when a long-lived catalog crosses a season end', () => {
      jest.useFakeTimers().setSystemTime(new Date(2018, 0, 1));
      const longLivedCatalog = new AssetCatalog();

      expect(
        longLivedCatalog
          .getSeasonsByPlatform('PC')
          .find((season) => season.id === 'division.bro.official.2018-01')?.isActive
      ).toBe(true);

      jest.setSystemTime(new Date(2018, 1, 1));

      expect(
        longLivedCatalog
          .getSeasonsByPlatform('PC')
          .find((season) => season.id === 'division.bro.official.2018-01')?.isActive
      ).toBe(false);
    });

    it('keeps platform validation in the catalog', () => {
      expect(() => catalog.getSeasonsByPlatform('INVALID' as any)).toThrow(PubgConfigurationError);
      expect(() => catalog.getActiveSeason(null as any)).toThrow(PubgConfigurationError);
    });

    it('resolves the active season from Season Activity at read time', () => {
      jest.useFakeTimers().setSystemTime(new Date(2018, 0, 15));

      expect(new AssetCatalog().getActiveSeason('PC')).toMatchObject({
        id: 'division.bro.official.2018-01',
        isActive: true,
        isOffseason: false,
      });

      jest.setSystemTime(new Date(2030, 0, 1));

      expect(new AssetCatalog().getActiveSeason('PC')).toMatchObject({
        id: 'division.bro.official.pc-2018-19',
        isActive: true,
        isOffseason: true,
      });
    });

    it('matches survival titles by rating range', () => {
      expect(catalog.getSurvivalTitle(1000)).toMatchObject({
        title: 'NOVICE',
        level: 5,
        pointsRequired: '1000-1199',
      });
    });

    it('rejects invalid ratings and returns null when no title matches', () => {
      expect(() => catalog.getSurvivalTitle(-1)).toThrow(PubgAssetError);
      expect(() => catalog.getSurvivalTitle(Number.POSITIVE_INFINITY)).toThrow(PubgAssetError);
      expect(catalog.getSurvivalTitle(0)).toBeNull();
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
      expect(catalog.getEquipmentAssetUrl('Item_Heal_FirstAid_C')).toBe(
        'https://raw.githubusercontent.com/pubg/api-assets/master/assets/equipment/icons/Heal_FirstAid.png'
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

    it('reports bundled catalog statistics and dictionary names', () => {
      expect(catalog.getAssetStats()).toMatchObject({
        totalItems: expect.any(Number),
        totalVehicles: expect.any(Number),
        totalMaps: expect.any(Number),
        categoryCounts: expect.any(Object),
      });
      expect(catalog.getDamageCauserName('Item_Weapon_AK47_C')).toEqual(expect.any(String));
      expect(catalog.getDamageTypeCategory('Damage_Gun')).toEqual(expect.any(String));
      expect(catalog.getGameModeName('squad')).toEqual(expect.any(String));
    });
  });
});
