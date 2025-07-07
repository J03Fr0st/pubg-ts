import 'dotenv/config';
import { assetManager, PubgClient } from '../src/index';

async function assetExample() {
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
    shard: 'pc-na',
  });

  try {
    console.log('=== PUBG Asset Management Example ===\n');

    // 1. Get user-friendly item names
    console.log('1. Item Names:');
    const itemNames = await Promise.all([
      client.assets.getItemName('Item_Weapon_AK47_C'),
      client.assets.getItemName('Item_Weapon_M416_C'),
      client.assets.getItemName('Item_Heal_FirstAid_C'),
    ]);

    console.log('  AK47 ID -> ', itemNames[0]);
    console.log('  M416 ID -> ', itemNames[1]);
    console.log('  FirstAid ID -> ', itemNames[2]);
    console.log();

    // 2. Get detailed item information
    console.log('2. Detailed Item Info:');
    const ak47Info = await client.assets.getItemInfo('Item_Weapon_AK47_C');
    if (ak47Info) {
      console.log('  AK47 Details:');
      console.log('    Name:', ak47Info.name);
      console.log('    Category:', ak47Info.category);
      console.log('    Subcategory:', ak47Info.subcategory);
      console.log('    Description:', ak47Info.description);
    }
    console.log();

    // 3. Get vehicle information
    console.log('3. Vehicle Names:');
    const vehicleNames = await Promise.all([
      client.assets.getVehicleName('BP_Motorbike_04_C'),
      client.assets.getVehicleName('BP_Pickup_06_C'),
    ]);

    console.log('  Motorbike ID -> ', vehicleNames[0]);
    console.log('  Pickup ID -> ', vehicleNames[1]);
    console.log();

    // 4. Get asset URLs for images
    console.log('4. Asset URLs:');
    console.log('  AK47 Icon:', client.assets.getWeaponAssetUrl('Item_Weapon_AK47_C', 'icon'));
    console.log('  M416 Image:', client.assets.getWeaponAssetUrl('Item_Weapon_M416_C', 'image'));
    console.log(
      '  FirstAid Icon:',
      client.assets.getEquipmentAssetUrl('Item_Heal_FirstAid_C', 'icon')
    );
    console.log('  Motorbike Icon:', client.assets.getVehicleAssetUrl('BP_Motorbike_04_C', 'icon'));
    console.log();

    // 5. Season information
    console.log('5. Season Information:');
    const currentSeason = await client.assets.getCurrentSeason();
    if (currentSeason) {
      console.log('  Current Season:');
      console.log('    Name:', currentSeason.name);
      console.log('    ID:', currentSeason.id);
      console.log('    Active:', currentSeason.isActive);
      console.log('    Start Date:', currentSeason.startDate);
      console.log('    End Date:', currentSeason.endDate);
    }
    console.log();

    // 6. Survival titles by rating
    console.log('6. Survival Titles:');
    const ratings = [1000, 1450, 1650, 1850];
    for (const rating of ratings) {
      const title = await client.assets.getSurvivalTitle(rating);
      console.log(`  Rating ${rating} -> ${title?.title || 'No title'}`);
    }
    console.log();

    // 7. Using the standalone asset manager
    console.log('7. Standalone Asset Manager:');
    const standaloneItemName = await assetManager.getItemName('Item_Weapon_SCAR-L_C');
    console.log('  SCAR-L ID -> ', standaloneItemName);
    console.log();

    // 8. Map names
    console.log('8. Map Names:');
    const mapIds = ['Baltic', 'Desert', 'Savage', 'Tiger'];
    for (const mapId of mapIds) {
      const mapName = await client.assets.getMapName(mapId);
      console.log(`  ${mapId} -> ${mapName}`);
    }
    console.log();

    // 9. Humanize unknown items (fallback functionality)
    console.log('9. Humanized Unknown Items:');
    const unknownItems = ['Item_Weapon_Thompson_C', 'Item_Armor_Vest_05_C', 'BP_Van_02_C'];

    for (const item of unknownItems) {
      const name = await client.assets.getItemName(item);
      console.log(`  ${item} -> ${name}`);
    }
    console.log();

    // 10. Cache management
    console.log('10. Cache Management:');
    console.log('  Clearing asset cache...');
    client.assets.clearCache();
    console.log('  Cache cleared!');
    console.log();

    console.log('=== Asset Example Complete ===');
  } catch (error) {
    console.error('Error in asset example:', error);
  }
}

// Example usage (uncomment to run):
// assetExample().catch(console.error);

export { assetExample };
