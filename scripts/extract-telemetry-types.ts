#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface TelemetryEvent {
  _T: string;
  [key: string]: any;
}

interface TypeAnalysis {
  eventType: string;
  count: number;
  sampleEvent: any;
  uniqueFields: Set<string>;
}

/**
 * Extract and analyze telemetry event types from a large JSON file
 */
async function extractTelemetryTypes() {
  const filePath = path.join(__dirname, '../tests/integration/telemetry.sample.json');

  console.log('🔍 Analyzing telemetry sample file...');
  console.log(`📁 File: ${filePath}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    process.exit(1);
  }

  // Get file size
  const stats = fs.statSync(filePath);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    console.log('📖 Reading JSON file...');
    const jsonContent = fs.readFileSync(filePath, 'utf8');

    console.log('🔧 Parsing JSON...');
    const events: TelemetryEvent[] = JSON.parse(jsonContent);

    console.log(`✅ Parsed ${events.length} telemetry events`);

    // Analyze event types
    const typeAnalysis = new Map<string, TypeAnalysis>();

    console.log('🔍 Analyzing event types...');
    events.forEach((event, index) => {
      if (!event._T) {
        console.warn(`⚠️  Event at index ${index} missing _T field`);
        return;
      }

      const eventType = event._T;

      if (!typeAnalysis.has(eventType)) {
        typeAnalysis.set(eventType, {
          eventType,
          count: 0,
          sampleEvent: event,
          uniqueFields: new Set<string>(),
        });
      }

      const analysis = typeAnalysis.get(eventType)!;
      analysis.count++;

      // Collect all unique fields for this event type
      Object.keys(event).forEach((key) => {
        analysis.uniqueFields.add(key);
      });
    });

    // Generate report
    console.log('\n📋 TELEMETRY EVENT TYPES ANALYSIS');
    console.log('='.repeat(50));

    const sortedTypes = Array.from(typeAnalysis.values()).sort((a, b) => b.count - a.count);

    console.log(`\n📊 Found ${sortedTypes.length} unique event types:\n`);

    sortedTypes.forEach((analysis, index) => {
      console.log(`${index + 1}. ${analysis.eventType}`);
      console.log(`   📈 Count: ${analysis.count}`);
      console.log(`   🔧 Fields: ${analysis.uniqueFields.size} unique fields`);
      console.log(`   📝 Fields: ${Array.from(analysis.uniqueFields).join(', ')}`);
      console.log('');
    });

    // Generate TypeScript interfaces
    console.log('🏗️  Generating TypeScript interfaces...');

    let typescriptContent = `// Auto-generated from telemetry.sample.json
// Generated on: ${new Date().toISOString()}
// Total events analyzed: ${events.length}

import { TelemetryEvent, TelemetryCommon, TelemetryPlayer, TelemetryGameResult } from '../src/types/telemetry';

`;

    sortedTypes.forEach((analysis) => {
      const interfaceName = analysis.eventType;
      const fields = Array.from(analysis.uniqueFields).sort();

      typescriptContent += `/**
 * ${interfaceName} - Found ${analysis.count} instances
 */
export interface ${interfaceName} extends TelemetryEvent {
  _T: '${interfaceName}';
`;

      // Analyze field types from sample
      fields.forEach((field) => {
        if (field === '_T') return; // Skip _T as it's already defined

        const sampleValue = analysis.sampleEvent[field];
        let fieldType = 'any';

        if (sampleValue === null || sampleValue === undefined) {
          fieldType = 'any';
        } else if (typeof sampleValue === 'string') {
          fieldType = 'string';
        } else if (typeof sampleValue === 'number') {
          fieldType = 'number';
        } else if (typeof sampleValue === 'boolean') {
          fieldType = 'boolean';
        } else if (Array.isArray(sampleValue)) {
          if (sampleValue.length > 0) {
            const firstElement = sampleValue[0];
            if (typeof firstElement === 'string') {
              fieldType = 'string[]';
            } else if (typeof firstElement === 'number') {
              fieldType = 'number[]';
            } else if (typeof firstElement === 'object') {
              fieldType = 'any[]';
            } else {
              fieldType = 'any[]';
            }
          } else {
            fieldType = 'any[]';
          }
        } else if (typeof sampleValue === 'object') {
          // Special handling for known types
          if (field === 'common') {
            fieldType = 'TelemetryCommon';
          } else if (
            field.includes('player') ||
            field === 'killer' ||
            field === 'victim' ||
            field === 'character'
          ) {
            fieldType = 'TelemetryPlayer';
          } else if (field.includes('GameResult')) {
            fieldType = 'TelemetryGameResult';
          } else {
            fieldType = 'any';
          }
        }

        // Make optional if field might not always be present
        const optional = field === 'common' || field.endsWith('?') ? '' : '?';

        typescriptContent += `  ${field}${optional}: ${fieldType};\n`;
      });

      typescriptContent += '}\n\n';
    });

    // Add union type
    typescriptContent += `/**
 * Union type of all telemetry events found in sample
 */
export type SampleTelemetryEvent =
${sortedTypes.map((analysis) => `  | ${analysis.eventType}`).join('\n')};
`;

    // Write to file
    const outputPath = path.join(__dirname, '../src/types/telemetry-sample-types.ts');
    fs.writeFileSync(outputPath, typescriptContent);

    console.log(`\n✅ TypeScript interfaces written to: ${outputPath}`);

    // Summary
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(30));
    console.log(`📊 Total events: ${events.length}`);
    console.log(`🎯 Unique types: ${sortedTypes.length}`);
    console.log(`📁 Output file: ${path.relative(process.cwd(), outputPath)}`);

    // Show most common event types
    console.log('\n🔥 Top 10 most common event types:');
    sortedTypes.slice(0, 10).forEach((analysis, index) => {
      const percentage = ((analysis.count / events.length) * 100).toFixed(2);
      console.log(`${index + 1}. ${analysis.eventType}: ${analysis.count} (${percentage}%)`);
    });
  } catch (error) {
    console.error('❌ Error processing file:', error);
    process.exit(1);
  }
}

// Run the extraction
if (require.main === module) {
  extractTelemetryTypes().catch(console.error);
}

export { extractTelemetryTypes };
