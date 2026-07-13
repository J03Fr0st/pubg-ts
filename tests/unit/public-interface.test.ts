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

describe('v2 public interface', () => {
  it('exports the deep v2 modules', () => {
    expect(pubg.PubgClient).toEqual(expect.any(Function));
    expect(pubg.AssetCatalog).toEqual(expect.any(Function));
  });

  it('does not export removed v1 facades', () => {
    expect(pubg).not.toHaveProperty('AssetManager');
    expect(pubg).not.toHaveProperty('assetManager');
  });

  it('wires the public client to the local asset catalog', () => {
    const client = new pubg.PubgClient({ apiKey: 'test-key', shard: 'steam' });

    expect(client.assets).toBeInstanceOf(pubg.AssetCatalog);
  });
});

const assertV2Types = (
  client: pubg.PubgClient,
  health: ClientHealth,
  assets: pubg.AssetCatalog,
  config: AssetCatalogConfig,
  modules: [Players, Matches, Seasons, Leaderboards, Samples]
): void => {
  void [health, assets, config, modules];
  client.getHealth();
  client.clearResponseCache();
  // @ts-expect-error removed in v2
  client.getCacheStats();
  // @ts-expect-error removed in v2
  client.getRateLimitStatus();
  // @ts-expect-error renamed in v2
  client.clearCache();
};
void assertV2Types;

// @ts-expect-error removed in v2
type RemovedAssetManager = import('../../src').AssetManager;
const removedAssetManagerTypeCheck = null as unknown as RemovedAssetManager;
// @ts-expect-error removed in v2
const removedAssetSingleton = pubg.assetManager;
void [removedAssetManagerTypeCheck, removedAssetSingleton];
