#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface CommentReplacement {
  pattern: RegExp;
  replacement: string;
}

/**
 * Clean up auto-generated comments in telemetry.ts
 */
async function cleanTelemetryComments() {
  console.log('🧹 Cleaning up telemetry comments...');

  const filePath = path.join(__dirname, '../src/types/telemetry.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Define meaningful descriptions for each event type
  const eventDescriptions: Record<string, string> = {
    LogItemUse: 'Item usage event',
    LogItemAttach: 'Item attachment event',
    LogItemDetach: 'Item detachment event',
    LogObjectInteraction: 'Object interaction event',
    LogWeaponFireCount: 'Weapon fire count event',
    LogVehicleDamage: 'Vehicle damage event',
    LogObjectDestroy: 'Object destruction event',
    LogItemPickupFromLootBox: 'Item pickup from loot box event',
    LogVaultStart: 'Vault/climb action start event',
    LogPlayerUseThrowable: 'Player throwable usage event',
    LogGameStatePeriodic: 'Periodic game state event',
    LogPlayerCreate: 'Player creation event',
    LogPlayerLogout: 'Player logout event',
    LogPlayerLogin: 'Player login event',
    LogItemPickupFromCarepackage: 'Item pickup from care package event',
    LogWheelDestroy: 'Vehicle wheel destruction event',
    LogPhaseChange: 'Game phase change event',
    LogCharacterCarry: 'Character carry state event',
    LogCarePackageSpawn: 'Care package spawn event',
    LogCarePackageLand: 'Care package landing event',
    LogPlayerDestroyProp: 'Player prop destruction event',
    LogEmPickupLiftOff: 'Emergency pickup lift off event',
    LogItemPutToVehicleTrunk: 'Item put to vehicle trunk event',
    LogItemPickupFromVehicleTrunk: 'Item pickup from vehicle trunk event',
    LogMatchDefinition: 'Match definition event',
    LogPlayerUseFlareGun: 'Player flare gun usage event',
  };

  console.log('🔄 Replacing auto-generated comments with meaningful descriptions...');

  // Replace each auto-generated comment with a meaningful description
  let replacementCount = 0;

  Object.entries(eventDescriptions).forEach(([eventName, description]) => {
    const pattern = new RegExp(
      `/\\*\\*\\s*\\n\\s*\\* ${eventName} - Found \\d+ instances\\s*\\n\\s*\\*/`,
      'g'
    );
    const replacement = `/**\n * ${description}\n */`;

    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      replacementCount++;
      console.log(`   ✓ Updated ${eventName}`);
    }
  });

  // Create backup and write cleaned file
  const backupPath = filePath + '.backup-comments';
  fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, content);

  console.log(`\n✅ Comment cleanup completed!`);
  console.log(`📁 Backup: ${path.relative(process.cwd(), backupPath)}`);
  console.log(`📁 Updated: ${path.relative(process.cwd(), filePath)}`);
  console.log(`🔄 Replaced ${replacementCount} auto-generated comments`);

  return {
    replacedComments: replacementCount,
    backupPath: backupPath,
  };
}

// Run the cleanup
if (require.main === module) {
  cleanTelemetryComments().catch(console.error);
}

export { cleanTelemetryComments };
