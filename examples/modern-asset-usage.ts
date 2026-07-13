import { AssetCatalog } from '../src';

/**
 * Modern Asset Management Usage Examples
 *
 * This example demonstrates the recommended synchronous API patterns
 * that provide zero-latency access to PUBG asset data.
 */

function modernAssetUsage() {
  const assets = new AssetCatalog();

  console.log('=== Modern Asset Management Examples ===\n');

  // ================================
  // Item Management (Synchronous)
  // ================================
  console.log('📦 Item Management:');

  // Get user-friendly item names
  const akName = assets.getItemName('Item_Weapon_AK47_C');
  const m416Name = assets.getItemName('Item_Weapon_M416_C');
  console.log(`  AK47: ${akName}`);
  console.log(`  M416: ${m416Name}`);

  // Get detailed item information
  const akInfo = assets.getItemInfo('Item_Weapon_AK47_C');
  if (akInfo) {
    console.log(`  ${akInfo.name} - Category: ${akInfo.category}, Type: ${akInfo.subcategory}`);
  }

  // Search for weapons
  const weapons = assets.getItemsByCategory('weapon');
  console.log(`  Found ${weapons.length} weapons in database`);

  // Fuzzy search
  const akWeapons = assets.searchItems('AK');
  console.log(`  AK search results: ${akWeapons.map((w) => w.name).join(', ')}`);

  // ================================
  // Vehicle Information (Synchronous)
  // ================================
  console.log('\n🚗 Vehicle Information:');

  const motorcycleName = assets.getVehicleName('BP_Motorbike_04_C');
  const motorcycleInfo = assets.getVehicleInfo('BP_Motorbike_04_C');

  console.log(`  Vehicle: ${motorcycleName}`);
  if (motorcycleInfo) {
    console.log(`  Type: ${motorcycleInfo.type}, Category: ${motorcycleInfo.category}`);
  }

  // ================================
  // Map Information (Synchronous)
  // ================================
  console.log('\n🗺️ Map Information:');

  const erangelName = assets.getMapName('Erangel_Main');
  const miramarName = assets.getMapName('Desert_Main');
  console.log(`  Erangel: ${erangelName}`);
  console.log(`  Miramar: ${miramarName}`);

  // Get all available maps
  const allMaps = assets.getAllMaps();
  console.log(`  Available maps: ${allMaps.map((m) => m.name).join(', ')}`);

  // ================================
  // Season Information (Synchronous)
  // ================================
  console.log('\n🏆 Season Information:');

  // Get seasons by platform
  const pcSeasons = assets.getSeasonsByPlatform('PC');
  const xboxSeasons = assets.getSeasonsByPlatform('XBOX');

  console.log(`  PC Seasons: ${pcSeasons.length}`);
  console.log(`  Xbox Seasons: ${xboxSeasons.length}`);

  // Get current active season
  const currentPcSeason = assets.getCurrentSeason('PC');
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
    const title = assets.getSurvivalTitle(rating);
    if (title) {
      console.log(`  Rating ${rating}: ${title.title} Level ${title.level}`);
    }
  });

  // ================================
  // Damage and Game Mode Info
  // ================================
  console.log('\n⚔️ Game Information:');

  const damageCauser = assets.getDamageCauserName('Item_Weapon_AK47_C');
  const damageType = assets.getDamageTypeCategory('Damage_Gun');
  const gameMode = assets.getGameModeName('squad-fpp');

  console.log(`  Damage Causer: ${damageCauser}`);
  console.log(`  Damage Type: ${damageType}`);
  console.log(`  Game Mode: ${gameMode}`);

  // ================================
  // Asset URLs (for images/icons)
  // ================================
  console.log('\n🖼️ Asset URLs:');

  const weaponIconUrl = assets.getWeaponAssetUrl('Item_Weapon_AK47_C', 'icon');
  const vehicleImageUrl = assets.getVehicleAssetUrl('BP_Motorbike_04_C', 'image');

  console.log(`  AK47 Icon: ${weaponIconUrl}`);
  console.log(`  Motorcycle Image: ${vehicleImageUrl}`);

  // ================================
  // Asset Statistics
  // ================================
  console.log('\n📊 Asset Statistics:');

  const stats = assets.getAssetStats();
  console.log(`  Total Items: ${stats.totalItems}`);
  console.log(`  Total Vehicles: ${stats.totalVehicles}`);
  console.log(`  Total Maps: ${stats.totalMaps}`);
  console.log('  Category Breakdown:');
  Object.entries(stats.categoryCounts).forEach(([category, count]) => {
    console.log(`    ${category}: ${count}`);
  });

  // Catalog data is local and synchronous.
  const allPcSeasons = assets.getSeasonsByPlatform('PC');
  const specificSeason = allPcSeasons.find((s) => s.id === 'division.bro.official.pc-2018-01');

  console.log('\n  ✅ Using the local-only Asset Catalog');
  console.log(`  Found specific season: ${specificSeason ? 'Yes' : 'No'}`);

  console.log('\n🎉 All asset operations completed synchronously from bundled data!');
}

// Error handling example
function assetErrorHandling() {
  const assets = new AssetCatalog();

  console.log('\n🛡️ Error Handling Examples:');

  // Handle non-existent items gracefully
  const unknownItem = assets.getItemInfo('Item_NonExistent_C');
  console.log(`  Unknown item result: ${unknownItem ? 'Found' : 'Not found (null)'}`);

  // Fallback for unknown IDs
  const unknownItemName = assets.getItemName('Item_Unknown_C');
  console.log(`  Unknown item name: ${unknownItemName}`); // Will be humanized

  // Safe platform handling
  try {
    const invalidSeasons = assets.getSeasonsByPlatform('INVALID' as any);
    console.log(`  Invalid platform result: ${invalidSeasons.length} seasons`);
  } catch (error) {
    console.log(`  Error handled: ${error}`);
  }
}

// Performance comparison
function performanceComparison() {
  const assets = new AssetCatalog();

  console.log('\n⚡ Performance Comparison:');

  // Synchronous operations (recommended)
  const startSync = performance.now();

  for (let i = 0; i < 1000; i++) {
    assets.getItemName('Item_Weapon_AK47_C');
    assets.getMapName('Erangel_Main');
    assets.getCurrentSeason('PC');
  }

  const endSync = performance.now();
  console.log(`  Synchronous (1000 operations): ${(endSync - startSync).toFixed(2)}ms`);

  console.log('  📈 Catalog lookups use bundled local data');
}

// Run examples
if (require.main === module) {
  modernAssetUsage();
  assetErrorHandling();
  performanceComparison();
}

export { modernAssetUsage, assetErrorHandling, performanceComparison };
