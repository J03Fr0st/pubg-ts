#!/usr/bin/env node
/**
 * Regenerates src/types/assets/*.ts from the bundled JSON under src/assets/.
 *
 * The JSON is the Asset Catalog's only source of truth; the generated types exist so callers get
 * IntelliSense for the same identifiers the runtime resolves. Run `npm run generate:asset-types`
 * after changing any bundled JSON, and never edit the generated files by hand.
 */
const { readdirSync, readFileSync, writeFileSync } = require('node:fs');
const { basename, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const assetsDir = resolve(root, 'src', 'assets');
const outDir = resolve(root, 'src', 'types', 'assets');

const HEADER =
  '// Generated from src/assets by scripts/generate-asset-types.js. Do not edit by hand.\n\n';

const readJson = (...segments) => JSON.parse(readFileSync(resolve(assetsDir, ...segments), 'utf8'));

const literal = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const unionType = (name, values) => {
  const unique = [...new Set(values)];
  if (unique.length === 0) {
    return `export type ${name} = never;\n`;
  }
  return `export type ${name} =\n${unique.map((value) => `  | ${literal(value)}`).join('\n')};\n`;
};

const pascalCase = (kebab) =>
  kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const writeGenerated = (fileName, body) => {
  writeFileSync(resolve(outDir, fileName), `${HEADER}${body}`, 'utf8');
};

const itemNames = readJson('dictionaries', 'item-id.json');
writeGenerated('items.ts', unionType('ItemId', Object.keys(itemNames)));

const vehicleNames = readJson('dictionaries', 'vehicle-id.json');
writeGenerated('vehicles.ts', unionType('VehicleId', Object.keys(vehicleNames)));

const mapNames = readJson('dictionaries', 'map-name.json');
writeGenerated(
  'maps.ts',
  [unionType('MapId', Object.keys(mapNames)), unionType('MapName', Object.values(mapNames))].join(
    '\n'
  )
);

const seasons = readJson('seasons.json');
writeGenerated(
  'seasons.ts',
  [
    'export interface SeasonAttributes {',
    '  startDate: string;',
    '  endDate: string;',
    '}',
    '',
    'export interface SeasonData {',
    '  id: string;',
    '  attributes: SeasonAttributes;',
    '}',
    '',
    'export interface SeasonsData {',
    '  [platform: string]: SeasonData[];',
    '}',
    '',
    unionType('Platform', Object.keys(seasons)),
  ].join('\n')
);

// Array-shaped enum files become one union each; object-shaped files (region-id.json) become one
// union per key, e.g. RegionIdErangel_Main.
const enumSections = [];
for (const file of readdirSync(resolve(assetsDir, 'enums')).sort()) {
  const typeName = pascalCase(basename(file, '.json'));
  const values = readJson('enums', file);

  if (Array.isArray(values)) {
    enumSections.push(unionType(typeName, values));
    continue;
  }

  for (const [key, keyValues] of Object.entries(values)) {
    enumSections.push(unionType(`${typeName}${key}`, keyValues));
  }
}
writeGenerated('enums.ts', enumSections.join('\n'));

writeGenerated(
  'index.ts',
  [
    "export * from './enums';",
    "export * from './items';",
    "export * from './maps';",
    "export * from './seasons';",
    "export * from './vehicles';",
    '',
  ].join('\n')
);

console.log(`Generated asset types in ${outDir}`);
