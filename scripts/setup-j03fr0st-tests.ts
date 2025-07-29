#!/usr/bin/env ts-node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupJ03Fr0stTests() {
  console.log('🎮 Setting up J03Fr0st Integration Tests\n');

  // Check if .env.test already exists
  const envTestPath = path.join(process.cwd(), '.env.test');
  const envExamplePath = path.join(process.cwd(), '.env.test.example');

  if (fs.existsSync(envTestPath)) {
    console.log('✅ .env.test file already exists');
    const overwrite = await question('Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Keeping existing .env.test file');
    } else {
      fs.unlinkSync(envTestPath);
    }
  }

  if (!fs.existsSync(envTestPath)) {
    // Copy example file
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envTestPath);
      console.log('✅ Created .env.test from example');
    } else {
      // Create basic .env.test file
      const basicEnv = `# PUBG API Configuration for Integration Tests
PUBG_API_KEY=your_pubg_api_key_here
PUBG_SHARD=pc-na
RUN_EXTENDED_TESTS=false
DEBUG=
`;
      fs.writeFileSync(envTestPath, basicEnv);
      console.log('✅ Created basic .env.test file');
    }

    console.log('\n🔑 PUBG API Key Setup:');
    console.log('1. Visit: https://developer.pubg.com');
    console.log('2. Create an account and generate an API key');
    console.log('3. Update the PUBG_API_KEY in .env.test');

    const apiKey = await question('\nEnter your PUBG API key (or press Enter to skip): ');
    if (apiKey && apiKey !== 'your_pubg_api_key_here') {
      // Update the .env.test file with the actual API key
      let envContent = fs.readFileSync(envTestPath, 'utf8');
      envContent = envContent.replace('PUBG_API_KEY=your_pubg_api_key_here', `PUBG_API_KEY=${apiKey}`);
      fs.writeFileSync(envTestPath, envContent);
      console.log('✅ API key updated in .env.test');
    }

    console.log('\n🌍 Shard/Region Setup:');
    console.log('Common shards:');
    console.log('  - pc-na (North America)');
    console.log('  - pc-eu (Europe)');
    console.log('  - pc-as (Asia)');
    console.log('  - pc-oc (Oceania)');
    console.log('  - xbox-na, ps4-na (Console)');

    const shard = await question('\nEnter the shard where J03Fr0st plays (or press Enter for pc-na): ');
    if (shard && shard !== 'pc-na') {
      let envContent = fs.readFileSync(envTestPath, 'utf8');
      envContent = envContent.replace('PUBG_SHARD=pc-na', `PUBG_SHARD=${shard}`);
      fs.writeFileSync(envTestPath, envContent);
      console.log(`✅ Shard updated to ${shard} in .env.test`);
    }
  }

  // Check if project is built
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('\n🔨 Building project...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Project built successfully');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  } else {
    console.log('✅ Project already built');
  }

  console.log('\n🧪 Test Commands:');
  console.log('  npm run test:j03fr0st           - Run J03Fr0st tests');
  console.log('  npm run test:j03fr0st:verbose   - Run with detailed output');
  console.log('  DEBUG=pubg-ts:* npm run test:j03fr0st - Run with debug logging');

  console.log('\n📁 Important Files:');
  console.log('  .env.test                       - Your API configuration');
  console.log('  tests/integration/j03fr0st-user.test.ts - Main test file');
  console.log('  tests/integration/README.md    - Detailed test documentation');

  const runTests = await question('\nWould you like to run the J03Fr0st tests now? (y/N): ');
  if (runTests.toLowerCase() === 'y') {
    console.log('\n🚀 Running J03Fr0st integration tests...\n');
    try {
      execSync('npm run test:j03fr0st:verbose', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
      });
    } catch (_error) {
      console.log('\n⚠️ Tests completed with some failures (this is normal if API key is not set)');
      console.log('Update your .env.test file with a valid API key and try again');
    }
  }

  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Add your PUBG API key to .env.test');
  console.log('2. Run: npm run test:j03fr0st');
  console.log('3. Check the test output for detailed results');

  rl.close();
}

if (require.main === module) {
  setupJ03Fr0stTests().catch(console.error);
}

export { setupJ03Fr0stTests };