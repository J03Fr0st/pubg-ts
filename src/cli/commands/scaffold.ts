import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const scaffoldCommand = new Command('scaffold')
  .alias('new')
  .description('scaffold a new PUBG TypeScript project')
  .argument('[project-name]', 'name of the project')
  .option('-t, --template <template>', 'project template (basic, advanced, bot)', 'basic')
  .option('-d, --directory <directory>', 'target directory', '.')
  .option('-y, --yes', 'skip prompts and use defaults')
  .action(async (projectName, options) => {
    const spinner = ora('Setting up project...').start();

    try {
      // Get project details
      const projectDetails = await getProjectDetails(projectName, options);

      // Create project structure
      await createProjectStructure(projectDetails, spinner);

      // Generate project files
      await generateProjectFiles(projectDetails, spinner);

      spinner.succeed(chalk.green('Project scaffolded successfully!'));

      // Show next steps
      showNextSteps(projectDetails);
    } catch (error) {
      spinner.fail(chalk.red('Failed to scaffold project'));
      console.error(error);
      process.exit(1);
    }
  });

async function getProjectDetails(projectName: string | undefined, options: any) {
  if (options.yes && projectName) {
    return {
      name: projectName,
      template: options.template,
      directory: options.directory,
      description: `A PUBG TypeScript project using ${options.template} template`,
      author: '',
      license: 'MIT',
    };
  }

  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: projectName || 'my-pubg-project',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(input))
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        return true;
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: [
        { name: 'Basic - Simple API client setup', value: 'basic' },
        { name: 'Advanced - Full-featured with caching and rate limiting', value: 'advanced' },
        { name: 'Bot - Discord bot with PUBG stats commands', value: 'bot' },
      ],
      default: options.template,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: (answers: any) => `A PUBG TypeScript project using ${answers.template} template`,
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: '',
    },
    {
      type: 'list',
      name: 'license',
      message: 'License:',
      choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'None'],
      default: 'MIT',
    },
  ];

  return await inquirer.prompt(questions as any);
}

async function createProjectStructure(projectDetails: any, spinner: any) {
  const projectPath = path.join(projectDetails.directory, projectDetails.name);

  spinner.text = 'Creating project structure...';

  // Create main directories
  const directories = [
    projectPath,
    path.join(projectPath, 'src'),
    path.join(projectPath, 'src', 'types'),
    path.join(projectPath, 'src', 'utils'),
    path.join(projectPath, 'tests'),
    path.join(projectPath, 'examples'),
    path.join(projectPath, 'docs'),
  ];

  // Add template-specific directories
  if (projectDetails.template === 'advanced') {
    directories.push(
      path.join(projectPath, 'src', 'services'),
      path.join(projectPath, 'src', 'cache'),
      path.join(projectPath, 'src', 'config')
    );
  }

  if (projectDetails.template === 'bot') {
    directories.push(
      path.join(projectPath, 'src', 'commands'),
      path.join(projectPath, 'src', 'events'),
      path.join(projectPath, 'src', 'bot')
    );
  }

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

async function generateProjectFiles(projectDetails: any, spinner: any) {
  const projectPath = path.join(projectDetails.directory, projectDetails.name);

  spinner.text = 'Generating project files...';

  // Generate package.json
  await generatePackageJson(projectPath, projectDetails);

  // Generate TypeScript config
  await generateTsConfig(projectPath, projectDetails);

  // Generate main index file
  await generateIndexFile(projectPath, projectDetails);

  // Generate environment file
  await generateEnvFile(projectPath, projectDetails);

  // Generate README
  await generateReadme(projectPath, projectDetails);

  // Generate .gitignore
  await generateGitignore(projectPath);

  // Generate template-specific files
  if (projectDetails.template === 'basic') {
    await generateBasicTemplate(projectPath, projectDetails);
  } else if (projectDetails.template === 'advanced') {
    await generateAdvancedTemplate(projectPath, projectDetails);
  } else if (projectDetails.template === 'bot') {
    await generateBotTemplate(projectPath, projectDetails);
  }
}

async function generatePackageJson(projectPath: string, projectDetails: any) {
  const packageJson = {
    name: projectDetails.name,
    version: '1.0.0',
    description: projectDetails.description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
      dev: 'ts-node src/index.ts',
      start: 'node dist/index.js',
      test: 'jest',
      'test:watch': 'jest --watch',
      lint: 'eslint src/**/*.ts',
      'lint:fix': 'eslint src/**/*.ts --fix',
    },
    keywords: ['pubg', 'api', 'typescript', 'gaming'],
    author: projectDetails.author,
    license: projectDetails.license,
    dependencies: {
      'pubg-ts': '^1.0.0',
    },
    devDependencies: {
      '@types/node': '^18.15.0',
      '@typescript-eslint/eslint-plugin': '^5.57.0',
      '@typescript-eslint/parser': '^5.57.0',
      eslint: '^8.37.0',
      jest: '^29.5.0',
      'ts-jest': '^29.1.0',
      'ts-node': '^10.9.0',
      typescript: '^5.0.0',
    },
  };

  // Add template-specific dependencies
  if (projectDetails.template === 'bot') {
    packageJson.dependencies = Object.assign(packageJson.dependencies, {
      'discord.js': '^14.0.0',
      dotenv: '^16.0.0',
    });
  }

  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
}

async function generateTsConfig(projectPath: string, _projectDetails: any) {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      declaration: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: 'node',
      allowSyntheticDefaultImports: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', '**/*.test.ts', '**/*.spec.ts'],
  };

  fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
}

async function generateIndexFile(projectPath: string, projectDetails: any) {
  let content = '';

  if (projectDetails.template === 'basic') {
    content = `import { PubgClient } from 'pubg-ts';

const client = new PubgClient({
  apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
  shard: 'pc-na' // Change to your preferred shard
});

async function main() {
  try {
    // Example: Get player data
    const players = await client.getPlayersByName(['player-name']);
    console.log('Players:', players);
    
    // Example: Get match data
    if (players.length > 0) {
      const matches = await client.getPlayerMatches(players[0].id);
      console.log('Matches:', matches);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();`;
  } else if (projectDetails.template === 'advanced') {
    content = `import { PubgClient } from 'pubg-ts';
import { config } from './config';
import { logger } from './utils/logger';

const client = new PubgClient({
  apiKey: config.apiKey,
  shard: config.shard,
  timeout: config.timeout,
  retryAttempts: config.retryAttempts,
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100
  }
});

async function main() {
  try {
    logger.info('Starting PUBG API client...');
    
    // Example: Advanced player stats analysis
    const playerName = 'example-player';
    const players = await client.getPlayersByName([playerName]);
    
    if (players.length === 0) {
      logger.error(\`Player \${playerName} not found\`);
      return;
    }
    
    const player = players[0];
    logger.info(\`Found player: \${player.attributes.name}\`);
    
    // Get recent matches
    const matches = await client.getPlayerMatches(player.id, { limit: 10 });
    logger.info(\`Retrieved \${matches.length} matches\`);
    
    // Get season stats
    const seasons = await client.getSeasons();
    const currentSeason = seasons.find(s => s.attributes.isCurrentSeason);
    
    if (currentSeason) {
      const seasonStats = await client.getPlayerSeasonStats(player.id, currentSeason.id);
      logger.info('Season stats:', seasonStats);
    }
    
  } catch (error) {
    logger.error('Error:', error);
  }
}

main();`;
  } else if (projectDetails.template === 'bot') {
    content = `import { Client, GatewayIntentBits } from 'discord.js';
import { PubgClient } from 'pubg-ts';
import dotenv from 'dotenv';

dotenv.config();

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const pubg = new PubgClient({
  apiKey: process.env.PUBG_API_KEY!,
  shard: 'pc-na'
});

discord.on('ready', () => {
  console.log(\`Bot logged in as \${discord.user?.tag}\`);
});

discord.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith('!pubg ')) {
    const args = message.content.slice(6).split(' ');
    const command = args[0];
    
    if (command === 'player' && args[1]) {
      try {
        const players = await pubg.getPlayersByName([args[1]]);
        if (players.length === 0) {
          message.reply('Player not found!');
          return;
        }
        
        const player = players[0];
        message.reply(\`Player: \${player.attributes.name}\\nID: \${player.id}\`);
      } catch (error) {
        message.reply('Error fetching player data!');
      }
    }
  }
});

discord.login(process.env.DISCORD_TOKEN);`;
  }

  fs.writeFileSync(path.join(projectPath, 'src', 'index.ts'), content);
}

async function generateEnvFile(projectPath: string, projectDetails: any) {
  let content = `# PUBG API Configuration
PUBG_API_KEY=your-pubg-api-key-here

# Environment
NODE_ENV=development
`;

  if (projectDetails.template === 'bot') {
    content += `
# Discord Bot Configuration
DISCORD_TOKEN=your-discord-bot-token-here
`;
  }

  fs.writeFileSync(path.join(projectPath, '.env.example'), content);
}

async function generateReadme(projectPath: string, projectDetails: any) {
  const content = `# ${projectDetails.name}

${projectDetails.description}

## Setup

1. Clone or download this project
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy the environment file and configure it:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Edit \`.env\` and add your PUBG API key:
   - Get your API key from [PUBG Developer Portal](https://developer.pubg.com/)
   - Add it to the \`PUBG_API_KEY\` variable

${
  projectDetails.template === 'bot'
    ? `5. Configure Discord bot:
   - Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
   - Add the bot token to the \`DISCORD_TOKEN\` variable

`
    : ''
}## Usage

Development mode:
\`\`\`bash
npm run dev
\`\`\`

Build for production:
\`\`\`bash
npm run build
npm start
\`\`\`

Run tests:
\`\`\`bash
npm test
\`\`\`

## API Documentation

For full API documentation, visit: [PUBG TypeScript SDK Docs](https://github.com/your-username/pubg-ts)

## License

${projectDetails.license}
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), content);
}

async function generateGitignore(projectPath: string) {
  const content = `# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`;

  fs.writeFileSync(path.join(projectPath, '.gitignore'), content);
}

async function generateBasicTemplate(projectPath: string, _projectDetails: any) {
  // Generate a simple example
  const exampleContent = `import { PubgClient } from 'pubg-ts';

const client = new PubgClient({
  apiKey: 'your-api-key',
  shard: 'pc-na'
});

async function getPlayerStats(playerName: string) {
  try {
    const players = await client.getPlayersByName([playerName]);
    
    if (players.length === 0) {
      console.log('Player not found');
      return;
    }
    
    const player = players[0];
    console.log(\`Player: \${player.attributes.name}\`);
    console.log(\`ID: \${player.id}\`);
    
    // Get recent matches
    const matches = await client.getPlayerMatches(player.id, { limit: 5 });
    console.log(\`Recent matches: \${matches.length}\`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getPlayerStats('example-player');
`;

  fs.writeFileSync(path.join(projectPath, 'examples', 'basic.ts'), exampleContent);
}

async function generateAdvancedTemplate(projectPath: string, _projectDetails: any) {
  // Generate config file
  const configContent = `export const config = {
  apiKey: process.env.PUBG_API_KEY || '',
  shard: process.env.PUBG_SHARD || 'pc-na',
  timeout: parseInt(process.env.PUBG_TIMEOUT || '10000'),
  retryAttempts: parseInt(process.env.PUBG_RETRY_ATTEMPTS || '3'),
  cache: {
    enabled: process.env.PUBG_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.PUBG_CACHE_TTL || '300000'),
    maxSize: parseInt(process.env.PUBG_CACHE_MAX_SIZE || '100')
  }
};
`;

  fs.writeFileSync(path.join(projectPath, 'src', 'config', 'index.ts'), configContent);

  // Generate logger utility
  const loggerContent = `import debug from 'debug';

export const logger = {
  info: debug('app:info'),
  warn: debug('app:warn'),
  error: debug('app:error'),
  debug: debug('app:debug')
};
`;

  fs.writeFileSync(path.join(projectPath, 'src', 'utils', 'logger.ts'), loggerContent);
}

async function generateBotTemplate(projectPath: string, _projectDetails: any) {
  // Generate bot commands
  const playerCommandContent = `import { Message } from 'discord.js';
import { PubgClient } from 'pubg-ts';

export async function handlePlayerCommand(message: Message, args: string[], pubg: PubgClient) {
  if (args.length === 0) {
    message.reply('Please provide a player name. Usage: \`!pubg player <name>\`');
    return;
  }
  
  const playerName = args[0];
  
  try {
    const players = await pubg.getPlayersByName([playerName]);
    
    if (players.length === 0) {
      message.reply(\`Player '\${playerName}' not found!\`);
      return;
    }
    
    const player = players[0];
    const embed = {
      title: \`Player: \${player.attributes.name}\`,
      color: 0x0099ff,
      fields: [
        { name: 'ID', value: player.id, inline: true },
        { name: 'Shard', value: player.attributes.shardId, inline: true }
      ],
      timestamp: new Date()
    };
    
    message.reply({ embeds: [embed] });
  } catch (error) {
    message.reply('Error fetching player data!');
    console.error(error);
  }
}
`;

  fs.writeFileSync(path.join(projectPath, 'src', 'commands', 'player.ts'), playerCommandContent);
}

function showNextSteps(projectDetails: any) {
  console.log(chalk.green('\n✨ Project created successfully!\n'));
  console.log(chalk.yellow('Next steps:'));
  console.log(chalk.cyan(`  1. cd ${projectDetails.name}`));
  console.log(chalk.cyan('  2. npm install'));
  console.log(chalk.cyan('  3. cp .env.example .env'));
  console.log(chalk.cyan('  4. Edit .env with your PUBG API key'));

  if (projectDetails.template === 'bot') {
    console.log(chalk.cyan('  5. Add your Discord bot token to .env'));
  }

  console.log(chalk.cyan('  5. npm run dev'));
  console.log(chalk.gray('\nHappy coding! 🎮'));
}
