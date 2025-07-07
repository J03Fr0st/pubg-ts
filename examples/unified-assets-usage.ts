import 'dotenv/config';
import { assetManager, type ItemId, PubgClient, type VehicleId } from '../src/index';

async function unifiedAssetsExample() {
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
    shard: 'pc-na',
  });

  console.log('=== PUBG Unified Assets Example ===\n');

  // 1. Type-safe item access with zero-latency local data
  console.log('1. Type-Safe Item Access:');
  const ak47Id: ItemId = 'Item_Weapon_AK47_C';
  const itemName = client.assets.getItemName(ak47Id);
  const itemInfo = client.assets.getItemInfo(ak47Id);

  console.log(`  Item ID: ${ak47Id}`);
  console.log(`  Name: ${itemName}`);
  if (itemInfo) {
    console.log(`  Category: ${itemInfo.category}`);
    console.log(`  Subcategory: ${itemInfo.subcategory}`);
  }
  console.log();

  // 2. Enhanced search and filtering (new capabilities)
  console.log('2. Enhanced Search & Filtering:');
  const akWeapons = client.assets.searchItems('AK');
  const allWeapons = client.assets.getItemsByCategory('weapon');

  console.log(`  Found ${akWeapons.length} items matching "AK"`);
  akWeapons.slice(0, 3).forEach((item) => {
    console.log(`    - ${item.name} (${item.category})`);
  });

  console.log(`  Total weapons: ${allWeapons.length}`);
  console.log();

  // 3. Vehicle information with type safety
  console.log('3. Vehicle Information:');
  const vehicleId: VehicleId = 'BP_Motorbike_04_C';
  const vehicleName = client.assets.getVehicleName(vehicleId);
  const vehicleInfo = client.assets.getVehicleInfo(vehicleId);

  console.log(`  Vehicle: ${vehicleName}`);
  if (vehicleInfo) {
    console.log(`  Type: ${vehicleInfo.type}`);
    console.log(`  Category: ${vehicleInfo.category}`);
  }
  console.log();

  // 4. Complete map coverage
  console.log('4. Map Information:');
  const allMaps = client.assets.getAllMaps();
  const mapName = client.assets.getMapName('Baltic_Main');

  console.log(`  Baltic map: ${mapName}`);
  console.log(`  Available maps (${allMaps.length} total):`);
  allMaps.slice(0, 5).forEach((map) => {
    console.log(`    - ${map.name} (${map.id})`);
  });
  console.log();

  // 5. Season data by platform
  console.log('5. Season Information:');
  const pcSeasons = client.assets.getSeasonsByPlatform('PC');
  const currentSeason = client.assets.getCurrentSeason('PC');

  console.log(`  Total PC seasons: ${pcSeasons.length}`);
  if (currentSeason) {
    console.log(`  Current season: ${currentSeason.name}`);
    console.log(`  Start date: ${currentSeason.startDate}`);
    console.log(`  Is active: ${currentSeason.isActive}`);
  }
  console.log();

  // 6. Survival titles with proper rating ranges
  console.log('6. Survival Titles:');
  const ratings = [100, 500, 1200, 1500, 2000];
  for (const rating of ratings) {
    const title = client.assets.getSurvivalTitle(rating);
    if (title) {
      console.log(
        `  Rating ${rating}: ${title.title} Level ${title.level} (${title.pointsRequired} points)`
      );
    } else {
      console.log(`  Rating ${rating}: No title found`);
    }
  }
  console.log();

  // 7. Additional dictionary features
  console.log('7. Additional Dictionaries:');
  const damageCauser = client.assets.getDamageCauserName('Item_Weapon_AK47_C');
  const damageType = client.assets.getDamageTypeCategory('Weapon');
  const gameMode = client.assets.getGameModeName('squad');

  console.log(`  Damage causer for AK47: ${damageCauser}`);
  console.log(`  Damage type for 'Weapon': ${damageType}`);
  console.log(`  Game mode name for 'squad': ${gameMode}`);
  console.log();

  // 8. Asset URLs with type safety
  console.log('8. Asset URLs:');
  const weaponIconUrl = client.assets.getWeaponAssetUrl(ak47Id, 'icon');
  const weaponImageUrl = client.assets.getWeaponAssetUrl(ak47Id, 'image');
  const vehicleIconUrl = client.assets.getVehicleAssetUrl(vehicleId, 'icon');

  console.log(`  AK47 Icon: ${weaponIconUrl}`);
  console.log(`  AK47 Image: ${weaponImageUrl}`);
  console.log(`  Motorbike Icon: ${vehicleIconUrl}`);
  console.log();

  // 9. Comprehensive asset statistics
  console.log('9. Asset Statistics:');
  const stats = client.assets.getAssetStats();
  console.log(`  Total items: ${stats.totalItems}`);
  console.log(`  Total vehicles: ${stats.totalVehicles}`);
  console.log(`  Total maps: ${stats.totalMaps}`);
  console.log('  Items by category:');
  Object.entries(stats.categoryCounts)
    .slice(0, 5)
    .forEach(([category, count]) => {
      console.log(`    - ${category}: ${count}`);
    });
  console.log();

  // 10. Using the standalone asset manager
  console.log('10. Standalone Asset Manager:');
  const standaloneItemName = assetManager.getItemName('Item_Heal_FirstAid_C');
  const standaloneVehicleName = assetManager.getVehicleName('BP_Pickup_06_C');

  console.log(`  FirstAid name: ${standaloneItemName}`);
  console.log(`  Pickup truck name: ${standaloneVehicleName}`);
  console.log();

  console.log('=== Unified Assets Example Complete ===');
  console.log('\n✨ Benefits of Unified Asset Manager:');
  console.log('  - Zero network requests (all data is local by default)');
  console.log('  - Full TypeScript type safety with IntelliSense');
  console.log('  - Enhanced search and filtering capabilities');
  console.log('  - Comprehensive PUBG asset coverage');
  console.log('  - Backward compatibility with existing APIs');
  console.log('  - Single unified interface for all asset operations');
  console.log('  - Performance caching and smart categorization');
}

// Example usage (uncomment to run):
// unifiedAssetsExample().catch(console.error);

export { unifiedAssetsExample };
