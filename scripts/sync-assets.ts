#!/usr/bin/env ts-node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * PUBG Asset Sync Script
 * Downloads and syncs all asset data from the official PUBG API assets repository
 */

const REPO_BASE_URL = 'https://raw.githubusercontent.com/pubg/api-assets/master';
const ASSETS_DIR = path.join(__dirname, '../src/assets');
const TYPES_DIR = path.join(__dirname, '../src/types');

interface AssetFile {
  name: string;
  url: string;
  outputPath: string;
}

interface DictionaryData {
  [key: string]: string;
}

interface EnumData {
  [key: string]: string[] | string[];
}

interface SeasonData {
  pc: Array<{
    id: string;
    attributes: {
      startDate: string;
      endDate: string;
    };
  }>;
  xbox: Array<{
    id: string;
    attributes: {
      startDate: string;
      endDate: string;
    };
  }>;
  // Add other platforms as needed
}

interface SurvivalTitle {
  [key: string]: {
    [level: string]: string;
  };
}

const ASSET_FILES: AssetFile[] = [
  // Root files
  {
    name: 'seasons',
    url: `${REPO_BASE_URL}/seasons.json`,
    outputPath: 'seasons.json',
  },
  {
    name: 'survivalTitles',
    url: `${REPO_BASE_URL}/survivalTitles.json`,
    outputPath: 'survival-titles.json',
  },

  // Dictionaries
  {
    name: 'itemDictionary',
    url: `${REPO_BASE_URL}/dictionaries/telemetry/item/itemId.json`,
    outputPath: 'dictionaries/item-id.json',
  },
  {
    name: 'vehicleDictionary',
    url: `${REPO_BASE_URL}/dictionaries/telemetry/vehicle/vehicleId.json`,
    outputPath: 'dictionaries/vehicle-id.json',
  },
  {
    name: 'mapDictionary',
    url: `${REPO_BASE_URL}/dictionaries/telemetry/mapName.json`,
    outputPath: 'dictionaries/map-name.json',
  },
  {
    name: 'damageCauserDictionary',
    url: `${REPO_BASE_URL}/dictionaries/telemetry/damageCauserName.json`,
    outputPath: 'dictionaries/damage-causer-name.json',
  },
  {
    name: 'damageTypeDictionary',
    url: `${REPO_BASE_URL}/dictionaries/telemetry/damageTypeCategory.json`,
    outputPath: 'dictionaries/damage-type-category.json',
  },
  {
    name: 'gameModeDictionary',
    url: `${REPO_BASE_URL}/dictionaries/gameMode.json`,
    outputPath: 'dictionaries/game-mode.json',
  },

  // Enums
  {
    name: 'attackTypeEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/attackType.json`,
    outputPath: 'enums/attack-type.json',
  },
  {
    name: 'carryStateEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/carryState.json`,
    outputPath: 'enums/carry-state.json',
  },
  {
    name: 'damageReasonEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/damageReason.json`,
    outputPath: 'enums/damage-reason.json',
  },
  {
    name: 'objectTypeEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/objectType.json`,
    outputPath: 'enums/object-type.json',
  },
  {
    name: 'objectTypeStatusEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/objectTypeStatus.json`,
    outputPath: 'enums/object-type-status.json',
  },
  {
    name: 'regionIdEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/regionId.json`,
    outputPath: 'enums/region-id.json',
  },
  {
    name: 'weatherIdEnum',
    url: `${REPO_BASE_URL}/enums/telemetry/weatherId.json`,
    outputPath: 'enums/weather-id.json',
  },
];

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (_error) {
    // Directory might already exist
  }
}

async function downloadAssetFile(file: AssetFile): Promise<any> {
  console.log(`Downloading ${file.name} from ${file.url}...`);

  try {
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure output directory exists
    const outputPath = path.join(ASSETS_DIR, file.outputPath);
    const outputDir = path.dirname(outputPath);
    await ensureDirectoryExists(outputDir);

    // Write the data to file
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved ${file.name} to ${outputPath}`);

    return data;
  } catch (error) {
    console.error(`✗ Failed to download ${file.name}:`, error);
    throw error;
  }
}

function generateItemTypes(itemDictionary: DictionaryData): string {
  // Group items by category for better type organization
  const categories: { [key: string]: string[] } = {};

  for (const [itemId, _itemName] of Object.entries(itemDictionary)) {
    const category = categorizeItemId(itemId);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(itemId);
  }

  let typeDefinitions = `// Generated from PUBG API assets
// Last updated: ${new Date().toISOString()}

export interface ItemDictionary {
  [key: string]: string;
}

export const ITEM_DICTIONARY: ItemDictionary = ${JSON.stringify(itemDictionary, null, 2)};

`;

  // Generate union types for each category
  for (const [category, items] of Object.entries(categories)) {
    const typeName = `${category.charAt(0).toUpperCase()}${category.slice(1)}ItemId`;
    const unionType = items.map((id) => `'${id}'`).join(' | ');
    typeDefinitions += `export type ${typeName} = ${unionType};\n\n`;
  }

  // Generate a master union type
  const allItems = Object.keys(itemDictionary)
    .map((id) => `'${id}'`)
    .join(' | ');
  typeDefinitions += `export type ItemId = ${allItems};\n\n`;

  return typeDefinitions;
}

function generateVehicleTypes(vehicleDictionary: DictionaryData): string {
  const vehicleIds = Object.keys(vehicleDictionary)
    .map((id) => `'${id}'`)
    .join(' | ');

  return `// Generated from PUBG API assets
// Last updated: ${new Date().toISOString()}

export interface VehicleDictionary {
  [key: string]: string;
}

export const VEHICLE_DICTIONARY: VehicleDictionary = ${JSON.stringify(vehicleDictionary, null, 2)};

export type VehicleId = ${vehicleIds};

`;
}

function generateMapTypes(mapDictionary: DictionaryData): string {
  const mapIds = Object.keys(mapDictionary)
    .map((id) => `'${id}'`)
    .join(' | ');

  return `// Generated from PUBG API assets
// Last updated: ${new Date().toISOString()}

export interface MapDictionary {
  [key: string]: string;
}

export const MAP_DICTIONARY: MapDictionary = ${JSON.stringify(mapDictionary, null, 2)};

export type MapId = ${mapIds};

export type MapName = ${Object.values(mapDictionary)
    .map((name) => `'${name}'`)
    .join(' | ')};

`;
}

function generateEnumTypes(enumData: { [filename: string]: any }): string {
  let typeDefinitions = `// Generated from PUBG API assets
// Last updated: ${new Date().toISOString()}

`;

  for (const [filename, data] of Object.entries(enumData)) {
    const enumName = filename
      .replace('.json', '')
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const capitalizedName = enumName.charAt(0).toUpperCase() + enumName.slice(1);

    if (Array.isArray(data)) {
      // Handle simple array enums
      const unionType = data.map((value) => `'${value}'`).join(' | ');
      typeDefinitions += `export type ${capitalizedName} = ${unionType};\n\n`;
    } else {
      // Handle object-based enums
      for (const [key, values] of Object.entries(data)) {
        if (Array.isArray(values)) {
          const typeName = `${capitalizedName}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
          const unionType = (values as string[]).map((value) => `'${value}'`).join(' | ');
          typeDefinitions += `export type ${typeName} = ${unionType};\n\n`;
        }
      }
    }

    // Export the raw data
    typeDefinitions += `export const ${enumName.toUpperCase()}_ENUM = ${JSON.stringify(data, null, 2)};\n\n`;
  }

  return typeDefinitions;
}

function generateSeasonTypes(seasonData: SeasonData): string {
  return `// Generated from PUBG API assets
// Last updated: ${new Date().toISOString()}

export interface SeasonAttributes {
  startDate: string;
  endDate: string;
}

export interface SeasonData {
  id: string;
  attributes: SeasonAttributes;
}

export interface SeasonsData {
  [platform: string]: SeasonData[];
}

export const SEASONS_DATA: SeasonsData = ${JSON.stringify(seasonData, null, 2)};

export type Platform = ${Object.keys(seasonData)
    .map((platform) => `'${platform}'`)
    .join(' | ')};

`;
}

function categorizeItemId(itemId: string): string {
  if (itemId.includes('Weapon')) return 'weapon';
  if (itemId.includes('Heal') || itemId.includes('Boost')) return 'consumable';
  if (itemId.includes('Attach')) return 'attachment';
  if (itemId.includes('Armor') || itemId.includes('Back')) return 'equipment';
  if (itemId.includes('Ammo')) return 'ammunition';
  return 'other';
}

async function generateAllTypes(assetData: { [key: string]: any }): Promise<void> {
  console.log('Generating TypeScript types...');

  await ensureDirectoryExists(path.join(TYPES_DIR, 'assets'));

  // Generate item types
  if (assetData.itemDictionary) {
    const itemTypes = generateItemTypes(assetData.itemDictionary);
    await fs.writeFile(path.join(TYPES_DIR, 'assets', 'items.ts'), itemTypes);
    console.log('✓ Generated item types');
  }

  // Generate vehicle types
  if (assetData.vehicleDictionary) {
    const vehicleTypes = generateVehicleTypes(assetData.vehicleDictionary);
    await fs.writeFile(path.join(TYPES_DIR, 'assets', 'vehicles.ts'), vehicleTypes);
    console.log('✓ Generated vehicle types');
  }

  // Generate map types
  if (assetData.mapDictionary) {
    const mapTypes = generateMapTypes(assetData.mapDictionary);
    await fs.writeFile(path.join(TYPES_DIR, 'assets', 'maps.ts'), mapTypes);
    console.log('✓ Generated map types');
  }

  // Generate enum types
  const enumData: { [filename: string]: any } = {};
  for (const file of ASSET_FILES) {
    if (file.name.endsWith('Enum') && assetData[file.name]) {
      const filename = file.outputPath.split('/').pop() || file.name;
      enumData[filename] = assetData[file.name];
    }
  }

  if (Object.keys(enumData).length > 0) {
    const enumTypes = generateEnumTypes(enumData);
    await fs.writeFile(path.join(TYPES_DIR, 'assets', 'enums.ts'), enumTypes);
    console.log('✓ Generated enum types');
  }

  // Generate season types
  if (assetData.seasons) {
    const seasonTypes = generateSeasonTypes(assetData.seasons);
    await fs.writeFile(path.join(TYPES_DIR, 'assets', 'seasons.ts'), seasonTypes);
    console.log('✓ Generated season types');
  }

  // Generate index file
  const indexContent = `// Generated asset types index
// Last updated: ${new Date().toISOString()}

export * from './items';
export * from './vehicles';
export * from './maps';
export * from './enums';
export * from './seasons';
`;

  await fs.writeFile(path.join(TYPES_DIR, 'assets', 'index.ts'), indexContent);
  console.log('✓ Generated asset types index');
}

async function main(): Promise<void> {
  console.log('🚀 Starting PUBG asset sync...\n');

  try {
    // Ensure base directories exist
    await ensureDirectoryExists(ASSETS_DIR);
    await ensureDirectoryExists(TYPES_DIR);

    // Download all asset files
    const assetData: { [key: string]: any } = {};

    for (const file of ASSET_FILES) {
      try {
        assetData[file.name] = await downloadAssetFile(file);
      } catch (_error) {
        console.warn(`Warning: Could not download ${file.name}, continuing...`);
      }
    }

    console.log('\n📝 Asset download completed!');
    console.log(`Downloaded ${Object.keys(assetData).length}/${ASSET_FILES.length} asset files\n`);

    // Generate TypeScript types
    await generateAllTypes(assetData);

    console.log('\n🎉 Asset sync completed successfully!');
    console.log(`Assets saved to: ${ASSETS_DIR}`);
    console.log(`Types generated in: ${path.join(TYPES_DIR, 'assets')}`);
  } catch (error) {
    console.error('\n❌ Asset sync failed:', error);
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as syncAssets };
