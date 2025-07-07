#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
const packageJson = require('../../package.json');
const version = packageJson.version;
import { scaffoldCommand } from './commands/scaffold';
import { assetsCommand } from './commands/assets';
import { setupCommand } from './commands/setup';

console.log(chalk.blue.bold(`
┌─────────────────────────────────────────────────────┐
│                                                     │
│               PUBG TypeScript CLI                   │
│                                                     │
│    🎮  Comprehensive PUBG API Development Tools    │
│                                                     │
└─────────────────────────────────────────────────────┘
`));

program
  .name('pubg-ts')
  .description('CLI for the PUBG TypeScript SDK')
  .version(version, '-v, --version', 'display version number');

// Add commands
program.addCommand(scaffoldCommand);
program.addCommand(assetsCommand);
program.addCommand(setupCommand);

// Show help by default if no arguments provided
if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(0);
}

program.parse();