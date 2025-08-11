#!/usr/bin/env ts-node

import * as fs from 'node:fs';
import * as path from 'node:path';

interface TelemetryEvent {
  _T: string;
  killerDamageInfo?: any;
  dBNODamageInfo?: any;
  finishDamageInfo?: any;
  [key: string]: any;
}

/**
 * Analyze live telemetry data for DamageInfo structure inconsistencies
 */
async function analyzeLiveDamageInfo() {
  console.log('🔍 Analyzing live telemetry data for DamageInfo structures...');

  const filePath = path.join(__dirname, '../live-telemetry-sample.json');

  if (!fs.existsSync(filePath)) {
    console.error('❌ Live telemetry file not found:', filePath);
    process.exit(1);
  }

  try {
    console.log('📖 Reading live telemetry JSON...');
    const content = fs.readFileSync(filePath, 'utf8');
    const events: TelemetryEvent[] = JSON.parse(content);

    console.log(`📊 Total events: ${events.length}`);

    // Find LogPlayerKillV2 events
    const killEvents = events.filter((event) => event._T === 'LogPlayerKillV2');
    console.log(`🎯 LogPlayerKillV2 events found: ${killEvents.length}`);

    if (killEvents.length === 0) {
      console.log('ℹ️ No LogPlayerKillV2 events found in this sample');

      // Let's also check for LogPlayerKill events
      const logPlayerKillEvents = events.filter((event) => event._T === 'LogPlayerKill');
      console.log(`🎯 LogPlayerKill events found: ${logPlayerKillEvents.length}`);

      if (logPlayerKillEvents.length > 0) {
        console.log('\n📋 Sample LogPlayerKill event structure:');
        console.log(JSON.stringify(logPlayerKillEvents[0], null, 2));
      }

      return;
    }

    // Analyze killerDamageInfo structures
    const damageInfoAnalysis = {
      killerDamageInfo: {
        array: 0,
        object: 0,
        null: 0,
        undefined: 0,
        samples: [] as any[],
      },
      dBNODamageInfo: {
        array: 0,
        object: 0,
        null: 0,
        undefined: 0,
        samples: [] as any[],
      },
      finishDamageInfo: {
        array: 0,
        object: 0,
        null: 0,
        undefined: 0,
        samples: [] as any[],
      },
    };

    killEvents.forEach((event, index) => {
      // Analyze killerDamageInfo
      if (event.killerDamageInfo === undefined) {
        damageInfoAnalysis.killerDamageInfo.undefined++;
      } else if (event.killerDamageInfo === null) {
        damageInfoAnalysis.killerDamageInfo.null++;
      } else if (Array.isArray(event.killerDamageInfo)) {
        damageInfoAnalysis.killerDamageInfo.array++;
        if (damageInfoAnalysis.killerDamageInfo.samples.length < 3) {
          damageInfoAnalysis.killerDamageInfo.samples.push(event.killerDamageInfo);
        }
      } else if (typeof event.killerDamageInfo === 'object') {
        damageInfoAnalysis.killerDamageInfo.object++;
        if (damageInfoAnalysis.killerDamageInfo.samples.length < 3) {
          damageInfoAnalysis.killerDamageInfo.samples.push(event.killerDamageInfo);
        }
      }

      // Analyze dBNODamageInfo
      if (event.dBNODamageInfo === undefined) {
        damageInfoAnalysis.dBNODamageInfo.undefined++;
      } else if (event.dBNODamageInfo === null) {
        damageInfoAnalysis.dBNODamageInfo.null++;
      } else if (Array.isArray(event.dBNODamageInfo)) {
        damageInfoAnalysis.dBNODamageInfo.array++;
        if (damageInfoAnalysis.dBNODamageInfo.samples.length < 3) {
          damageInfoAnalysis.dBNODamageInfo.samples.push(event.dBNODamageInfo);
        }
      } else if (typeof event.dBNODamageInfo === 'object') {
        damageInfoAnalysis.dBNODamageInfo.object++;
        if (damageInfoAnalysis.dBNODamageInfo.samples.length < 3) {
          damageInfoAnalysis.dBNODamageInfo.samples.push(event.dBNODamageInfo);
        }
      }

      // Analyze finishDamageInfo
      if (event.finishDamageInfo === undefined) {
        damageInfoAnalysis.finishDamageInfo.undefined++;
      } else if (event.finishDamageInfo === null) {
        damageInfoAnalysis.finishDamageInfo.null++;
      } else if (Array.isArray(event.finishDamageInfo)) {
        damageInfoAnalysis.finishDamageInfo.array++;
        if (damageInfoAnalysis.finishDamageInfo.samples.length < 3) {
          damageInfoAnalysis.finishDamageInfo.samples.push(event.finishDamageInfo);
        }
      } else if (typeof event.finishDamageInfo === 'object') {
        damageInfoAnalysis.finishDamageInfo.object++;
        if (damageInfoAnalysis.finishDamageInfo.samples.length < 3) {
          damageInfoAnalysis.finishDamageInfo.samples.push(event.finishDamageInfo);
        }
      }
    });

    console.log('\n📊 DamageInfo Structure Analysis:');
    console.log('=====================================');

    Object.entries(damageInfoAnalysis).forEach(([field, analysis]) => {
      console.log(`\n🔸 ${field}:`);
      console.log(`  - Array: ${analysis.array}`);
      console.log(`  - Object: ${analysis.object}`);
      console.log(`  - Null: ${analysis.null}`);
      console.log(`  - Undefined: ${analysis.undefined}`);

      if (analysis.samples.length > 0) {
        console.log(`  - Sample structures:`);
        analysis.samples.forEach((sample, i) => {
          console.log(`    Sample ${i + 1}:`, JSON.stringify(sample, null, 6));
        });
      }
    });

    // Show a complete sample event
    if (killEvents.length > 0) {
      console.log('\n📋 Complete LogPlayerKillV2 sample:');
      console.log('=====================================');
      console.log(JSON.stringify(killEvents[0], null, 2));
    }

    console.log('\n✅ Analysis complete!');
  } catch (error) {
    console.error('❌ Error analyzing telemetry data:', error);
    process.exit(1);
  }
}

analyzeLiveDamageInfo();
