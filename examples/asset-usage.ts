import 'dotenv/config';
import { AssetCatalog, type ItemId, PubgClient, type VehicleId } from '../src/index';

/**
 * Asset Catalog usage.
 *
 * Every lookup is synchronous and reads data bundled with the SDK — no network, no sync step.
 * The catalog is reachable as `client.assets` or as a standalone `AssetCatalog`; the only
 * configuration is `assetBaseUrl`, which changes generated image URLs and nothing else.
 */
function assetCatalogExample() {
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
    shard: 'pc-na',
  });
  const assets = client.assets;

  console.log('=== PUBG Asset Catalog Example ===\n');

  // Identifiers are typed, so misspelled IDs fail at compile time.
  console.log('1. Items:');
  const ak47: ItemId = 'Item_Weapon_AK47_C';
  console.log(`  ${ak47} -> ${assets.getItemName(ak47)}`);
  const ak47Info = assets.getItemInfo(ak47);
  if (ak47Info) {
    console.log(`  category=${ak47Info.category} subcategory=${ak47Info.subcategory}`);
  }
  console.log(`  weapons in catalog: ${assets.getItemsByCategory('weapon').length}`);
  console.log(
    `  search "AK": ${assets
      .searchItems('AK')
      .map((item) => item.name)
      .join(', ')}`
  );
  console.log();

  // Well-formed but unknown identifiers fall back to a humanized name and `null` metadata.
  console.log('2. Unknown identifiers:');
  console.log(`  Item_Weapon_Thompson_C -> ${assets.getItemName('Item_Weapon_Thompson_C')}`);
  console.log(`  metadata: ${assets.getItemInfo('Item_Weapon_Thompson_C')}`);
  console.log();

  console.log('3. Vehicles and maps:');
  const motorbike: VehicleId = 'BP_Motorbike_04_C';
  console.log(`  ${motorbike} -> ${assets.getVehicleName(motorbike)}`);
  console.log(`  type: ${assets.getVehicleInfo(motorbike)?.type}`);
  console.log(`  Desert_Main -> ${assets.getMapName('Desert_Main')}`);
  console.log(`  maps: ${assets.getAllMaps().length}`);
  console.log();

  // Season Activity is evaluated when you read it, from the bundled start and end dates.
  // For the season PUBG itself flags as current, call `client.seasons.getCurrentSeason()`.
  console.log('4. Seasons:');
  const pcSeasons = assets.getSeasonsByPlatform('PC');
  console.log(`  PC seasons bundled: ${pcSeasons.length}`);
  const activeSeason = assets.getActiveSeason('PC');
  if (activeSeason) {
    console.log(`  active now: ${activeSeason.id} (offseason: ${activeSeason.isOffseason})`);
  }
  console.log();

  console.log('5. Survival titles:');
  for (const rating of [1000, 1450, 1850]) {
    console.log(`  rating ${rating} -> ${assets.getSurvivalTitle(rating)?.title ?? 'no title'}`);
  }
  console.log();

  console.log('6. Telemetry dictionaries:');
  console.log(`  damage causer: ${assets.getDamageCauserName('Item_Weapon_AK47_C')}`);
  console.log(`  damage type: ${assets.getDamageTypeCategory('Damage_Gun')}`);
  console.log(`  game mode: ${assets.getGameModeName('squad-fpp')}`);
  console.log();

  console.log('7. Image URLs:');
  console.log(`  ${assets.getWeaponAssetUrl(ak47, 'icon')}`);
  console.log(`  ${assets.getVehicleAssetUrl(motorbike, 'image')}`);
  const cdnAssets = new AssetCatalog({ assetBaseUrl: 'https://cdn.example.com/pubg' });
  console.log(`  custom base: ${cdnAssets.getEquipmentAssetUrl('Item_Heal_FirstAid_C')}`);
  console.log();

  console.log('8. Catalog statistics:');
  const stats = assets.getAssetStats();
  console.log(
    `  items=${stats.totalItems} vehicles=${stats.totalVehicles} maps=${stats.totalMaps}`
  );
  console.log(`  by category: ${JSON.stringify(stats.categoryCounts)}`);
  console.log();

  console.log('=== Asset Catalog Example Complete ===');
}

// Example usage (uncomment to run):
// assetCatalogExample();

export { assetCatalogExample };
