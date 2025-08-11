#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface MissingInterface {
  name: string;
  count: number;
  definition: string;
}

/**
 * Smart merge that only adds missing interfaces and enhances existing ones
 */
async function smartMergeTelemetry() {
  console.log('🧠 Smart merging telemetry types...');

  const currentFilePath = path.join(__dirname, '../src/types/telemetry.ts');
  const sampleFilePath = path.join(__dirname, '../src/types/telemetry-sample-types.ts');

  const currentContent = fs.readFileSync(currentFilePath, 'utf8');
  const sampleContent = fs.readFileSync(sampleFilePath, 'utf8');

  // Extract existing interface names from current file
  const existingInterfaces = new Set<string>();
  const existingMatches = currentContent.match(/export interface (\w+)/g);
  if (existingMatches) {
    existingMatches.forEach((match) => {
      const interfaceName = match.replace('export interface ', '');
      existingInterfaces.add(interfaceName);
    });
  }

  console.log(`📋 Found ${existingInterfaces.size} existing interfaces`);

  // Extract missing interfaces from sample file
  const missingInterfaces: MissingInterface[] = [];
  const sampleInterfaceRegex =
    /\/\*\*\s*\n\s*\* (\w+) - Found (\d+) instances[\s\S]*?\*\/\s*export interface (\w+) extends TelemetryEvent \{[\s\S]*?\n\}/g;

  let match;
  while ((match = sampleInterfaceRegex.exec(sampleContent)) !== null) {
    const [fullMatch, interfaceName1, count, interfaceName2] = match;
    const interfaceName = interfaceName1 || interfaceName2;

    if (!existingInterfaces.has(interfaceName)) {
      // Clean up the interface definition
      let cleanedDefinition = fullMatch
        .replace(/from '\.\.\/src\/types\/telemetry'/g, "from './telemetry'")
        .replace(/character\?: any;/g, 'character?: TelemetryPlayer;')
        .replace(/attacker\?: any;/g, 'attacker?: TelemetryPlayer;')
        .replace(/victim\?: any;/g, 'victim?: TelemetryPlayer;')
        .replace(/killer\?: any;/g, 'killer?: TelemetryPlayer;')
        .replace(/finisher\?: any;/g, 'finisher?: TelemetryPlayer;')
        .replace(/reviver\?: any;/g, 'reviver?: TelemetryPlayer;')
        .replace(/vehicle\?: any;/g, 'vehicle?: TelemetryVehicle;')
        .replace(/item\?: any;/g, 'item?: TelemetryItem;')
        .replace(/parentItem\?: any;/g, 'parentItem?: TelemetryItem;')
        .replace(/childItem\?: any;/g, 'childItem?: TelemetryItem;')
        .replace(/weapon\?: any;/g, 'weapon?: TelemetryItem;')
        .replace(/objectLocation\?: any;/g, 'objectLocation?: TelemetryLocation;');

      missingInterfaces.push({
        name: interfaceName,
        count: parseInt(count),
        definition: cleanedDefinition,
      });
    }
  }

  console.log(`➕ Found ${missingInterfaces.length} missing interfaces to add`);

  // Sort by count (most common first)
  missingInterfaces.sort((a, b) => b.count - a.count);

  // Show what we're adding
  console.log('\n🆕 Missing interfaces to add:');
  missingInterfaces.forEach((iface) => {
    console.log(`   • ${iface.name} (${iface.count} instances)`);
  });

  let updatedContent = currentContent;

  // Enhance existing interfaces with missing fields
  console.log('\n🔧 Enhancing existing interfaces...');

  // Add isThroughPenetrableWall to LogPlayerTakeDamage if missing
  if (
    updatedContent.includes('LogPlayerTakeDamage') &&
    !updatedContent.includes('isThroughPenetrableWall')
  ) {
    updatedContent = updatedContent.replace(
      /(export interface LogPlayerTakeDamage[^}]*isAttackerInVehicle: boolean;)/,
      '$1\n  isThroughPenetrableWall: boolean;'
    );
    console.log('   ✓ Added isThroughPenetrableWall to LogPlayerTakeDamage');
  }

  // Enhance LogPlayerKillV2 with missing fields found in sample
  if (updatedContent.includes('LogPlayerKillV2')) {
    const killV2Enhancements = [
      { field: 'dBNODamageInfo', type: 'DamageInfo[]', check: 'dBNODamageInfo' },
      { field: 'finishDamageInfo', type: 'DamageInfo[]', check: 'finishDamageInfo' },
      { field: 'victimGameResult', type: 'TelemetryGameResult', check: 'victimGameResult' },
      { field: 'killerVehicle', type: 'TelemetryVehicle', check: 'killerVehicle' },
      { field: 'victimVehicle', type: 'TelemetryVehicle', check: 'victimVehicle' },
    ];

    killV2Enhancements.forEach((enhancement) => {
      if (
        !updatedContent.includes(enhancement.check + ':') &&
        !updatedContent.includes(enhancement.check + '?:')
      ) {
        updatedContent = updatedContent.replace(
          /(export interface LogPlayerKillV2[^}]*killerDamageInfo: DamageInfo\[\];)/,
          `$1\n  ${enhancement.field}?: ${enhancement.type};`
        );
        console.log(`   ✓ Added ${enhancement.field} to LogPlayerKillV2`);
      }
    });
  }

  // Add missing interfaces before TelemetryData type
  if (missingInterfaces.length > 0) {
    console.log(`\n📝 Adding ${missingInterfaces.length} new interfaces...`);

    const interfaceDefinitions = missingInterfaces.map((iface) => iface.definition).join('\n\n');

    const insertPosition = updatedContent.indexOf('export type TelemetryData');
    if (insertPosition !== -1) {
      const beforeTelemetryData = updatedContent.substring(0, insertPosition);
      const afterTelemetryData = updatedContent.substring(insertPosition);

      updatedContent =
        beforeTelemetryData + '\n' + interfaceDefinitions + '\n\n' + afterTelemetryData;

      console.log('   ✓ Inserted new interfaces before TelemetryData type');
    }
  }

  // Update TelemetryData union type with new interfaces
  if (missingInterfaces.length > 0) {
    console.log('\n🔗 Updating TelemetryData union type...');

    const newTypeNames = missingInterfaces.map((iface) => iface.name);
    const newUnionTypes = newTypeNames.map((type) => `  | ${type}`).join('\n');

    const telemetryDataRegex =
      /(export type TelemetryData = Array<[^>]+)(\s*\| TelemetryEvent\s*>;)/;
    const match = updatedContent.match(telemetryDataRegex);

    if (match) {
      updatedContent = updatedContent.replace(telemetryDataRegex, `$1\n${newUnionTypes}$2`);
      console.log(`   ✓ Added ${newTypeNames.length} new types to union`);
    }
  }

  // Create backup and write updated file
  const backupPath = currentFilePath + '.backup-smart';
  fs.writeFileSync(backupPath, currentContent);
  fs.writeFileSync(currentFilePath, updatedContent);

  console.log(`\n✅ Smart merge completed successfully!`);
  console.log(`📁 Backup: ${path.relative(process.cwd(), backupPath)}`);
  console.log(`📁 Updated: ${path.relative(process.cwd(), currentFilePath)}`);

  // Summary
  console.log('\n📊 MERGE SUMMARY');
  console.log('='.repeat(40));
  console.log(`🎯 Existing interfaces: ${existingInterfaces.size}`);
  console.log(`➕ Added interfaces: ${missingInterfaces.length}`);
  console.log(`🔧 Enhanced interfaces: LogPlayerKillV2, LogPlayerTakeDamage`);
  console.log(`📋 Total interfaces: ${existingInterfaces.size + missingInterfaces.length}`);

  return {
    existingCount: existingInterfaces.size,
    addedCount: missingInterfaces.length,
    totalCount: existingInterfaces.size + missingInterfaces.length,
  };
}

// Run the smart merge
if (require.main === module) {
  smartMergeTelemetry().catch(console.error);
}

export { smartMergeTelemetry };
