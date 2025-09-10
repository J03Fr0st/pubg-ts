#!/usr/bin/env ts-node

import {
  type LogPlayerKillV2,
  DamageInfoUtils,
  FlexibleDamageInfo,
  DamageInfo,
} from '../src/types/telemetry';

/**
 * Example demonstrating how to handle flexible DamageInfo in LogPlayerKillV2 events
 */

// Example 1: killerDamageInfo as a single object
const killEventWithSingleDamage: Partial<LogPlayerKillV2> = {
  _T: 'LogPlayerKillV2',
  killerDamageInfo: {
    damageReason: 'HeadShot',
    damageTypeCategory: 'Damage_Gun',
    damageCauserName: 'WeapAKM_C',
    additionalInfo: ['Compensator', 'RedDotSight'],
    distance: 125.5,
    isThroughPenetrableWall: false,
  },
};

// Example 2: killerDamageInfo as an array
const killEventWithArrayDamage: Partial<LogPlayerKillV2> = {
  _T: 'LogPlayerKillV2',
  killerDamageInfo: [
    {
      damageReason: 'LegShot',
      damageTypeCategory: 'Damage_Gun',
      damageCauserName: 'WeapSCAR-L_C',
      additionalInfo: ['Compensator'],
      distance: 89.51,
      isThroughPenetrableWall: false,
    },
    {
      damageReason: 'BodyShot',
      damageTypeCategory: 'Damage_Gun',
      damageCauserName: 'WeapSCAR-L_C',
      additionalInfo: ['Compensator'],
      distance: 89.51,
      isThroughPenetrableWall: false,
    },
  ],
};

// Example 3: killerDamageInfo as null
const killEventWithNullDamage: Partial<LogPlayerKillV2> = {
  _T: 'LogPlayerKillV2',
  killerDamageInfo: null,
};

/**
 * Function to process any LogPlayerKillV2 event regardless of DamageInfo format
 */
function processKillEvent(killEvent: Partial<LogPlayerKillV2>) {
  console.log(`\\n🎯 Processing ${killEvent._T} event`);

  const { killerDamageInfo } = killEvent;

  // Check if damage info exists
  if (DamageInfoUtils.hasData(killerDamageInfo)) {
    console.log('✅ Damage info available');

    // Get all damage entries as an array
    const damageArray = DamageInfoUtils.toArray(killerDamageInfo);
    console.log(`📊 Total damage entries: ${damageArray.length}`);

    // Process each damage entry
    damageArray.forEach((damage, index) => {
      console.log(
        `  ${index + 1}. ${damage.damageReason} - ${damage.damageCauserName} (${damage.distance}m)`
      );
    });

    // Get the primary/first damage info
    const primaryDamage = DamageInfoUtils.getFirst(killerDamageInfo);
    if (primaryDamage) {
      console.log(
        `🎯 Primary damage: ${primaryDamage.damageReason} with ${primaryDamage.damageCauserName}`
      );
    }
  } else {
    console.log('❌ No damage info available');
  }
}

// Test all scenarios
console.log('🧪 Testing Flexible DamageInfo handling');
console.log('======================================');

processKillEvent(killEventWithSingleDamage);
processKillEvent(killEventWithArrayDamage);
processKillEvent(killEventWithNullDamage);

console.log('\\n✅ All tests completed successfully!');
console.log('\\n💡 Key benefits of FlexibleDamageInfo:');
console.log('  - Handles real PUBG telemetry data variations');
console.log('  - Type-safe with TypeScript');
console.log('  - Utility functions for easy processing');
console.log('  - Backward compatible with existing code');
