import type {
  AssetCatalogConfig,
  ClientHealth,
  Leaderboards,
  Matches,
  Players,
  Samples,
  Seasons,
} from '../../src';
import * as pubg from '../../src';

const REMOVED_ASSET_DATA_EXPORTS = [
  'ITEM_DICTIONARY',
  'VEHICLE_DICTIONARY',
  'MAP_DICTIONARY',
  'MAP_NAMES',
  'GAME_MODE_DICTIONARY',
  'GAME_MODES',
  'DAMAGE_CAUSER_DICTIONARY',
  'DAMAGE_CAUSER_NAME',
  'SEASONS_DATA',
];

describe('public interface', () => {
  it('exports the deep modules', () => {
    expect(pubg.PubgClient).toEqual(expect.any(Function));
    expect(pubg.AssetCatalog).toEqual(expect.any(Function));
  });

  it('does not export removed v1 facades', () => {
    expect(pubg).not.toHaveProperty('AssetManager');
    expect(pubg).not.toHaveProperty('assetManager');
  });

  it('does not export a second copy of the bundled Asset Catalog data', () => {
    for (const name of REMOVED_ASSET_DATA_EXPORTS) {
      expect(pubg).not.toHaveProperty(name);
    }
  });

  it('wires the public client to the local asset catalog', () => {
    const client = new pubg.PubgClient({ apiKey: 'test-key', shard: 'steam' });

    expect(client.assets).toBeInstanceOf(pubg.AssetCatalog);
  });
});

const assertPublicTypes = (
  client: pubg.PubgClient,
  health: ClientHealth,
  assets: pubg.AssetCatalog,
  config: AssetCatalogConfig,
  modules: [Players, Matches, Seasons, Leaderboards, Samples]
): void => {
  void [health, config, modules];
  client.getHealth();
  client.clearResponseCache();
  assets.getActiveSeason('PC');
  // @ts-expect-error removed in v2
  client.getCacheStats();
  // @ts-expect-error removed in v2
  client.getRateLimitStatus();
  // @ts-expect-error renamed in v2
  client.clearCache();
  // @ts-expect-error renamed to getActiveSeason; the network lookup is client.seasons.getCurrentSeason()
  assets.getCurrentSeason('PC');
};
void assertPublicTypes;

// @ts-expect-error removed in v2
type RemovedAssetManager = import('../../src').AssetManager;
const removedAssetManagerTypeCheck = null as unknown as RemovedAssetManager;
// @ts-expect-error removed in v2
const removedAssetSingleton = pubg.assetManager;
// @ts-expect-error removed: dead duplicate of the PubgClientConfig request settings
type RemovedClientOptions = import('../../src').PubgClientOptions;
const removedClientOptionsTypeCheck = null as unknown as RemovedClientOptions;
// @ts-expect-error removed in v3: use the Asset Catalog lookup methods
type RemovedItemDictionary = import('../../src').AssetItemDictionary;
// @ts-expect-error removed in v3: use the Asset Catalog lookup methods
type RemovedVehicleDictionary = import('../../src').AssetVehicleDictionary;
// @ts-expect-error removed in v3: use the Asset Catalog lookup methods
type RemovedMapDictionary = import('../../src').MapDictionary;
const removedDictionaryTypesCheck: [
  RemovedItemDictionary,
  RemovedVehicleDictionary,
  RemovedMapDictionary,
] = [null, null, null];
void [
  removedAssetManagerTypeCheck,
  removedAssetSingleton,
  removedClientOptionsTypeCheck,
  removedDictionaryTypesCheck,
];

// @ts-expect-error v2 has no remote catalog version
const versionConfig: AssetCatalogConfig = { version: 'latest' };
// @ts-expect-error v2 derived caches are not caller-configurable
const cacheConfig: AssetCatalogConfig = { cacheAssets: false };
// @ts-expect-error v2 catalog data is always local
const localDataConfig: AssetCatalogConfig = { useLocalData: false };
void [versionConfig, cacheConfig, localDataConfig];
