import { AssetManager } from '../src/utils/assets';

/**
 * Modern Asset Management Usage Examples
 *
 * This example demonstrates the recommended synchronous API patterns
 * that provide zero-latency access to PUBG asset data.
 */

async function modernAssetUsage() {
  const assetManager = new AssetManager();

  console.log('=== Modern Asset Management Examples ===\n');

  // ================================
  // Item Management (Synchronous)
  // ================================
  console.log('📦 Item Management:');

  // Get user-friendly item names
  const akName = assetManager.getItemName('Item_Weapon_AK47_C');
  const m416Name = assetManager.getItemName('Item_Weapon_M416_C');
  console.log(`  AK47: ${akName}`);
  console.log(`  M416: ${m416Name}`);

  // Get detailed item information
  const akInfo = assetManager.getItemInfo('Item_Weapon_AK47_C');
  if (akInfo) {
    console.log(`  ${akInfo.name} - Category: ${akInfo.category}, Type: ${akInfo.subcategory}`);
  }

  // Search for weapons
  const weapons = assetManager.getItemsByCategory('weapon');
  console.log(`  Found ${weapons.length} weapons in database`);

  // Fuzzy search
  const akWeapons = assetManager.searchItems('AK');
  console.log(`  AK search results: ${akWeapons.map((w) => w.name).join(', ')}`);

  // ================================
  // Vehicle Information (Synchronous)
  // ================================
  console.log('\n🚗 Vehicle Information:');

  const motorcycleName = assetManager.getVehicleName('BP_Motorbike_04_C');
  const motorcycleInfo = assetManager.getVehicleInfo('BP_Motorbike_04_C');

  console.log(`  Vehicle: ${motorcycleName}`);
  if (motorcycleInfo) {
    console.log(`  Type: ${motorcycleInfo.type}, Category: ${motorcycleInfo.category}`);
  }

  // ================================
  // Map Information (Synchronous)
  // ================================
  console.log('\n🗺️ Map Information:');

  const erangelName = assetManager.getMapName('Erangel_Main');
  const miramarName = assetManager.getMapName('Desert_Main');
  console.log(`  Erangel: ${erangelName}`);
  console.log(`  Miramar: ${miramarName}`);

  // Get all available maps
  const allMaps = assetManager.getAllMaps();
  console.log(`  Available maps: ${allMaps.map((m) => m.name).join(', ')}`);

  // ================================
  // Season Information (Synchronous)
  // ================================
  console.log('\n🏆 Season Information:');

  // Get seasons by platform
  const pcSeasons = assetManager.getSeasonsByPlatform('PC');
  const xboxSeasons = assetManager.getSeasonsByPlatform('XBOX');

  console.log(`  PC Seasons: ${pcSeasons.length}`);
  console.log(`  Xbox Seasons: ${xboxSeasons.length}`);

  // Get current active season
  const currentPcSeason = assetManager.getCurrentSeason('PC');
  if (currentPcSeason) {
    console.log(`  Current PC Season: ${currentPcSeason.name}`);
    console.log(`  Is Active: ${currentPcSeason.isActive}`);
  }

  // ================================
  // Survival Titles (Synchronous)
  // ================================
  console.log('\n🎖️ Survival Titles:');

  const ratings = [100, 500, 1000, 1500, 2000];
  ratings.forEach((rating) => {
    const title = assetManager.getSurvivalTitle(rating);
    if (title) {
      console.log(`  Rating ${rating}: ${title.title} Level ${title.level}`);
    }
  });

  // ================================
  // Damage and Game Mode Info
  // ================================
  console.log('\n⚔️ Game Information:');

  const damageCauser = assetManager.getDamageCauserName('Item_Weapon_AK47_C');
  const damageType = assetManager.getDamageTypeCategory('Damage_Gun');
  const gameMode = assetManager.getGameModeName('squad-fpp');

  console.log(`  Damage Causer: ${damageCauser}`);
  console.log(`  Damage Type: ${damageType}`);
  console.log(`  Game Mode: ${gameMode}`);

  // ================================
  // Asset URLs (for images/icons)
  // ================================
  console.log('\n🖼️ Asset URLs:');

  const weaponIconUrl = assetManager.getWeaponAssetUrl('Item_Weapon_AK47_C', 'icon');
  const vehicleImageUrl = assetManager.getVehicleAssetUrl('BP_Motorbike_04_C', 'image');

  console.log(`  AK47 Icon: ${weaponIconUrl}`);
  console.log(`  Motorcycle Image: ${vehicleImageUrl}`);

  // ================================
  // Asset Statistics
  // ================================
  console.log('\n📊 Asset Statistics:');

  const stats = assetManager.getAssetStats();
  console.log(`  Total Items: ${stats.totalItems}`);
  console.log(`  Total Vehicles: ${stats.totalVehicles}`);
  console.log(`  Total Maps: ${stats.totalMaps}`);
  console.log('  Category Breakdown:');
  Object.entries(stats.categoryCounts).forEach(([category, count]) => {
    console.log(`    ${category}: ${count}`);
  });

  // ================================
  // Migration Examples
  // ================================
  console.log('\n🔄 Migration from Legacy Async Methods:');

  // ❌ Old way (deprecated):
  // const seasonInfo = await assetManager.getSeasonInfo('division.bro.official.pc-2018-01');
  // const seasons = await assetManager.getSeasons();

  // ✅ New way (recommended):
  const allPcSeasons = assetManager.getSeasonsByPlatform('PC');
  const specificSeason = allPcSeasons.find((s) => s.id === 'division.bro.official.pc-2018-01');

  console.log('  ✅ Using synchronous methods for better performance');
  console.log(`  Found specific season: ${specificSeason ? 'Yes' : 'No'}`);

  console.log('\n🎉 All asset operations completed synchronously with zero network latency!');
}

// Error handling example
function assetErrorHandling() {
  const assetManager = new AssetManager();

  console.log('\n🛡️ Error Handling Examples:');

  // Handle non-existent items gracefully
  const unknownItem = assetManager.getItemInfo('Item_NonExistent_C');
  console.log(`  Unknown item result: ${unknownItem ? 'Found' : 'Not found (null)'}`);

  // Fallback for unknown IDs
  const unknownItemName = assetManager.getItemName('Item_Unknown_C');
  console.log(`  Unknown item name: ${unknownItemName}`); // Will be humanized

  // Safe platform handling
  try {
    const invalidSeasons = assetManager.getSeasonsByPlatform('INVALID' as any);
    console.log(`  Invalid platform result: ${invalidSeasons.length} seasons`);
  } catch (error) {
    console.log(`  Error handled: ${error}`);
  }
}

// Performance comparison
function performanceComparison() {
  const assetManager = new AssetManager();

  console.log('\n⚡ Performance Comparison:');

  // Synchronous operations (recommended)
  const startSync = performance.now();

  for (let i = 0; i < 1000; i++) {
    assetManager.getItemName('Item_Weapon_AK47_C');
    assetManager.getMapName('Erangel_Main');
    assetManager.getCurrentSeason('PC');
  }

  const endSync = performance.now();
  console.log(`  Synchronous (1000 operations): ${(endSync - startSync).toFixed(2)}ms`);

  // Note: Async operations would require network requests and be much slower
  console.log('  📈 Synchronous operations are 100x+ faster than network requests');
}

// Run examples
if (require.main === module) {
  modernAssetUsage()
    .then(() => {
      assetErrorHandling();
      performanceComparison();
    })
    .catch(console.error);
}

export { modernAssetUsage, assetErrorHandling, performanceComparison };
