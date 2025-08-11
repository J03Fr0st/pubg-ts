#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface EventTypeInfo {
  name: string;
  existsInCurrent: boolean;
  existsInSample: boolean;
  sampleCount?: number;
  fields?: string[];
}

/**
 * Merge telemetry types from sample data with existing manually crafted types
 */
async function mergeTelemetryTypes() {
  console.log('🔄 Merging telemetry types...');

  const currentFilePath = path.join(__dirname, '../src/types/telemetry.ts');
  const sampleFilePath = path.join(__dirname, '../src/types/telemetry-sample-types.ts');

  // Read current telemetry file
  const currentContent = fs.readFileSync(currentFilePath, 'utf8');
  const sampleContent = fs.readFileSync(sampleFilePath, 'utf8');

  // Extract event types from current file
  const currentEventTypes = new Set<string>();
  const currentEventMatches = currentContent.match(/export interface (Log\w+)/g);
  if (currentEventMatches) {
    currentEventMatches.forEach((match) => {
      const eventType = match.replace('export interface ', '');
      currentEventTypes.add(eventType);
    });
  }

  // Extract event types from sample file
  const sampleEventTypes = new Map<string, number>();
  const sampleEventMatches = sampleContent.match(/\* (\w+) - Found (\d+) instances/g);
  if (sampleEventMatches) {
    sampleEventMatches.forEach((match) => {
      const [, eventType, count] = match.match(/\* (\w+) - Found (\d+) instances/)!;
      sampleEventTypes.set(eventType, parseInt(count));
    });
  }

  // Analyze differences
  const allEventTypes = new Set([...currentEventTypes, ...sampleEventTypes.keys()]);
  const eventAnalysis: EventTypeInfo[] = [];

  allEventTypes.forEach((eventType) => {
    eventAnalysis.push({
      name: eventType,
      existsInCurrent: currentEventTypes.has(eventType),
      existsInSample: sampleEventTypes.has(eventType),
      sampleCount: sampleEventTypes.get(eventType),
    });
  });

  // Sort by sample count (most common first)
  eventAnalysis.sort((a, b) => (b.sampleCount || 0) - (a.sampleCount || 0));

  console.log('\n📊 Event Type Analysis:');
  console.log('='.repeat(80));

  const onlyInCurrent = eventAnalysis.filter((e) => e.existsInCurrent && !e.existsInSample);
  const onlyInSample = eventAnalysis.filter((e) => !e.existsInCurrent && e.existsInSample);
  const inBoth = eventAnalysis.filter((e) => e.existsInCurrent && e.existsInSample);

  console.log(`\n✅ In both files (${inBoth.length}):`);
  inBoth.forEach((event) => {
    console.log(`   ${event.name} - ${event.sampleCount} instances`);
  });

  console.log(`\n📝 Only in current file (${onlyInCurrent.length}):`);
  onlyInCurrent.forEach((event) => {
    console.log(`   ${event.name} - manually defined`);
  });

  console.log(`\n🆕 Only in sample data (${onlyInSample.length}):`);
  onlyInSample.forEach((event) => {
    console.log(`   ${event.name} - ${event.sampleCount} instances`);
  });

  // Extract interfaces from sample file for missing types
  const missingInterfaces: string[] = [];

  onlyInSample.forEach((event) => {
    const interfaceRegex = new RegExp(
      `/\\*\\*[\\s\\S]*?\\* ${event.name} - Found \\d+ instances[\\s\\S]*?\\*/\\s*export interface ${event.name}[\\s\\S]*?^}`,
      'gm'
    );

    const match = sampleContent.match(interfaceRegex);
    if (match) {
      missingInterfaces.push(match[0]);
    }
  });

  // Build the updated telemetry file
  let updatedContent = currentContent;

  // First, let's improve some of the existing interfaces based on sample data
  console.log('\n🔧 Enhancing existing interfaces with sample data insights...');

  // Update LogPlayerTakeDamage to include isThroughPenetrableWall
  if (
    currentContent.includes('LogPlayerTakeDamage') &&
    !currentContent.includes('isThroughPenetrableWall')
  ) {
    updatedContent = updatedContent.replace(
      /(export interface LogPlayerTakeDamage[^}]*isAttackerInVehicle: boolean;)/,
      '$1\n  isThroughPenetrableWall: boolean;'
    );
    console.log('   ✓ Added isThroughPenetrableWall to LogPlayerTakeDamage');
  }

  // Update LogPlayerKillV2 to match sample data structure
  if (currentContent.includes('LogPlayerKillV2')) {
    // Add missing fields found in sample
    const killV2Updates = [
      { field: 'dBNODamageInfo', type: 'DamageInfo[]' },
      { field: 'finishDamageInfo', type: 'DamageInfo[]' },
      { field: 'victimGameResult', type: 'TelemetryGameResult' },
      { field: 'killerVehicle', type: 'TelemetryVehicle' },
      { field: 'victimVehicle', type: 'TelemetryVehicle' },
    ];

    killV2Updates.forEach((update) => {
      if (!currentContent.includes(update.field)) {
        updatedContent = updatedContent.replace(
          /(export interface LogPlayerKillV2[^}]*killerDamageInfo: DamageInfo\[\];)/,
          `$1\n  ${update.field}?: ${update.type};`
        );
        console.log(`   ✓ Added ${update.field} to LogPlayerKillV2`);
      }
    });
  }

  // Add missing interfaces before the TelemetryData type definition
  if (missingInterfaces.length > 0) {
    console.log(`\n➕ Adding ${missingInterfaces.length} missing interfaces...`);

    // Clean up the interfaces - fix import path and improve types
    const cleanedInterfaces = missingInterfaces.map((interfaceStr) => {
      return (
        interfaceStr
          .replace(/from '\.\.\/src\/types\/telemetry'/g, "from './telemetry'")
          .replace(/: any\[\]/g, ': any[]')
          .replace(/: any;/g, ': any;')
          // Make some educated guesses for better typing
          .replace(/character\?: any;/g, 'character?: TelemetryPlayer;')
          .replace(/attacker\?: any;/g, 'attacker?: TelemetryPlayer;')
          .replace(/victim\?: any;/g, 'victim?: TelemetryPlayer;')
          .replace(/killer\?: any;/g, 'killer?: TelemetryPlayer;')
          .replace(/finisher\?: any;/g, 'finisher?: TelemetryPlayer;')
          .replace(/vehicle\?: any;/g, 'vehicle?: TelemetryVehicle;')
          .replace(/item\?: any;/g, 'item?: TelemetryItem;')
          .replace(/parentItem\?: any;/g, 'parentItem?: TelemetryItem;')
          .replace(/childItem\?: any;/g, 'childItem?: TelemetryItem;')
          .replace(/weapon\?: any;/g, 'weapon?: TelemetryItem;')
          .replace(/gameState\?: any;/g, 'gameState?: any;')
          .replace(/itemPackage\?: any;/g, 'itemPackage?: any;')
          .replace(/objectLocation\?: any;/g, 'objectLocation?: TelemetryLocation;')
      );
    });

    // Find the position to insert new interfaces (before TelemetryData type)
    const insertPosition = updatedContent.indexOf('export type TelemetryData');
    if (insertPosition !== -1) {
      const beforeTelemetryData = updatedContent.substring(0, insertPosition);
      const afterTelemetryData = updatedContent.substring(insertPosition);

      updatedContent =
        beforeTelemetryData + '\n' + cleanedInterfaces.join('\n\n') + '\n\n' + afterTelemetryData;

      console.log('   ✓ Inserted missing interfaces before TelemetryData type');
    }
  }

  // Update the TelemetryData union type
  const newEventTypes = onlyInSample.map((e) => e.name);
  if (newEventTypes.length > 0) {
    console.log(`\n🔗 Updating TelemetryData union type with ${newEventTypes.length} new types...`);

    // Find the TelemetryData type and add new types
    const telemetryDataRegex =
      /(export type TelemetryData = Array<[^>]+)(\s*\| TelemetryEvent\s*>;)/;
    const match = updatedContent.match(telemetryDataRegex);

    if (match) {
      const newUnionTypes = newEventTypes.map((type) => `  | ${type}`).join('\n');
      updatedContent = updatedContent.replace(telemetryDataRegex, `$1\n${newUnionTypes}$2`);
      console.log('   ✓ Added new event types to TelemetryData union');
    }
  }

  // Write the updated file
  const backupPath = currentFilePath + '.backup';
  fs.writeFileSync(backupPath, currentContent);
  fs.writeFileSync(currentFilePath, updatedContent);

  console.log(`\n✅ Updated telemetry.ts successfully!`);
  console.log(`📁 Backup saved to: ${path.relative(process.cwd(), backupPath)}`);
  console.log(`📁 Updated file: ${path.relative(process.cwd(), currentFilePath)}`);

  // Summary
  console.log('\n📋 MERGE SUMMARY');
  console.log('='.repeat(40));
  console.log(`🎯 Total event types: ${allEventTypes.size}`);
  console.log(`✅ Already defined: ${inBoth.length}`);
  console.log(`➕ Added from sample: ${onlyInSample.length}`);
  console.log(`📝 Manual only: ${onlyInCurrent.length}`);

  if (onlyInSample.length > 0) {
    console.log('\n🆕 New event types added:');
    onlyInSample.forEach((event) => {
      console.log(`   • ${event.name} (${event.sampleCount} instances)`);
    });
  }

  return {
    totalTypes: allEventTypes.size,
    addedTypes: onlyInSample.length,
    existingTypes: inBoth.length,
    manualTypes: onlyInCurrent.length,
  };
}

// Run the merge
if (require.main === module) {
  mergeTelemetryTypes().catch(console.error);
}

export { mergeTelemetryTypes };
