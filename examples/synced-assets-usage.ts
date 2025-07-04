import 'dotenv/config';
import { PubgClient, syncedAssetManager, ItemId, VehicleId, MapId } from '../src/index';

async function syncedAssetsExample() {
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
    shard: 'pc-na',
  });

  console.log('=== PUBG Synced Assets Example ===\n');

  // 1. Type-safe item access
  console.log('1. Type-Safe Item Access:');
  const ak47Id: ItemId = 'Item_Weapon_AK47_C';
  const itemName = client.syncedAssets.getItemName(ak47Id);
  const itemInfo = client.syncedAssets.getItemInfo(ak47Id);
  
  console.log(`  Item ID: ${ak47Id}`);
  console.log(`  Name: ${itemName}`);
  if (itemInfo) {
    console.log(`  Category: ${itemInfo.category}`);
    console.log(`  Subcategory: ${itemInfo.subcategory}`);
  }
  console.log();

  // 2. Get items by category
  console.log('2. Items by Category:');
  const weapons = client.syncedAssets.getItemsByCategory('weapon');
  console.log(`  Found ${weapons.length} weapons`);
  console.log('  First 5 weapons:');
  weapons.slice(0, 5).forEach(weapon => {
    console.log(`    - ${weapon.name} (${weapon.id})`);
  });
  console.log();

  // 3. Vehicle information with type safety
  console.log('3. Vehicle Information:');
  const vehicleId: VehicleId = 'BP_Motorbike_04_C';
  const vehicleName = client.syncedAssets.getVehicleName(vehicleId);
  const vehicleInfo = client.syncedAssets.getVehicleInfo(vehicleId);
  
  console.log(`  Vehicle: ${vehicleName}`);
  if (vehicleInfo) {
    console.log(`  Type: ${vehicleInfo.type}`);
    console.log(`  Category: ${vehicleInfo.category}`);
  }
  console.log();

  // 4. Map information
  console.log('4. Map Information:');
  const allMaps = client.syncedAssets.getAllMaps();
  console.log('  Available maps:');
  allMaps.forEach(map => {
    console.log(`    - ${map.name} (${map.id})`);
  });
  console.log();

  // 5. Season information by platform
  console.log('5. Season Information:');
  const pcSeasons = client.syncedAssets.getSeasonsByPlatform('pc');
  const currentSeason = client.syncedAssets.getCurrentSeason('pc');
  
  console.log(`  Total PC seasons: ${pcSeasons.length}`);
  if (currentSeason) {
    console.log(`  Current season: ${currentSeason.name}`);
    console.log(`  Start date: ${currentSeason.startDate}`);
    console.log(`  End date: ${currentSeason.endDate}`);
    console.log(`  Is active: ${currentSeason.isActive}`);
  }
  console.log();

  // 6. Survival titles
  console.log('6. Survival Titles:');
  const ratings = [500, 1200, 1500, 1800, 5000];
  for (const rating of ratings) {
    const title = client.syncedAssets.getSurvivalTitle(rating);
    if (title) {
      console.log(`  Rating ${rating}: ${title.title} Level ${title.level} (${title.pointsRequired} points)`);
    } else {
      console.log(`  Rating ${rating}: No title found`);
    }
  }
  console.log();

  // 7. Search functionality
  console.log('7. Item Search:');
  const searchResults = client.syncedAssets.searchItems('AK');
  console.log(`  Search for "AK" found ${searchResults.length} items:`);
  searchResults.slice(0, 3).forEach(item => {
    console.log(`    - ${item.name} (${item.category})`);
  });
  console.log();

  // 8. Enhanced asset URLs with type safety
  console.log('8. Type-Safe Asset URLs:');
  const weaponIconUrl = client.syncedAssets.getWeaponAssetUrl(ak47Id, 'icon');
  const vehicleImageUrl = client.syncedAssets.getVehicleAssetUrl(vehicleId, 'image');
  
  console.log(`  AK47 Icon: ${weaponIconUrl}`);
  console.log(`  Motorbike Image: ${vehicleImageUrl}`);
  console.log();

  // 9. Additional dictionary features
  console.log('9. Additional Dictionaries:');
  const damageCauser = client.syncedAssets.getDamageCauserName('Item_Weapon_AK47_C');
  const gameMode = client.syncedAssets.getGameModeName('squad');
  
  console.log(`  Damage causer for AK47: ${damageCauser}`);
  console.log(`  Game mode name for 'squad': ${gameMode}`);
  console.log();

  // 10. Asset statistics
  console.log('10. Asset Statistics:');
  const stats = client.syncedAssets.getAssetStats();
  console.log(`  Total items: ${stats.totalItems}`);
  console.log(`  Total vehicles: ${stats.totalVehicles}`);
  console.log(`  Total maps: ${stats.totalMaps}`);
  console.log('  Items by category:');
  Object.entries(stats.categoryCounts).forEach(([category, count]) => {
    console.log(`    - ${category}: ${count}`);
  });
  console.log();

  // 11. Using the standalone synced asset manager
  console.log('11. Standalone Synced Asset Manager:');
  const standaloneItemName = syncedAssetManager.getItemName('Item_Heal_FirstAid_C');
  const standaloneMapName = syncedAssetManager.getMapName('Desert');
  
  console.log(`  FirstAid name: ${standaloneItemName}`);
  console.log(`  Desert map name: ${standaloneMapName}`);
  console.log();

  console.log('=== Synced Assets Example Complete ===');
  console.log('\n✨ Benefits of Synced Assets:');
  console.log('  - Zero network requests (all data is local)');
  console.log('  - Full TypeScript type safety');
  console.log('  - Comprehensive PUBG asset coverage');
  console.log('  - Enhanced search and filtering capabilities');
  console.log('  - Automatic data categorization and metadata');
}

// Example usage (uncomment to run):
// syncedAssetsExample().catch(console.error);

export { syncedAssetsExample };