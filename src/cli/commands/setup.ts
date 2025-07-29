import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

export const setupCommand = new Command('setup')
  .description('setup development environment and tools')
  .addCommand(createInitCommand())
  .addCommand(createConfigCommand())
  .addCommand(createTestCommand())
  .addCommand(createLintCommand())
  .addCommand(createDocsCommand());

function createInitCommand() {
  return new Command('init')
    .description('initialize development environment')
    .option('--skip-install', 'skip npm install')
    .option('--skip-git', 'skip git initialization')
    .action(async (options) => {
      const spinner = ora('Initializing development environment...').start();
      
      try {
        // Check if we're in a Node.js project
        if (!fs.existsSync('package.json')) {
          spinner.fail('No package.json found. Please run this in a Node.js project directory.');
          return;
        }
        
        spinner.text = 'Setting up development dependencies...';
        
        if (!options.skipInstall) {
          // Install development dependencies
          const devDeps = [
            '@types/node',
            '@typescript-eslint/eslint-plugin',
            '@typescript-eslint/parser',
            'eslint',
            'jest',
            '@types/jest',
            'ts-jest',
            'ts-node',
            'typescript',
            'husky',
            'lint-staged'
          ];
          
          execSync(`npm install --save-dev ${devDeps.join(' ')}`, { stdio: 'inherit' });
        }
        
        spinner.text = 'Creating configuration files...';
        
        // Create TypeScript config if it doesn't exist
        if (!fs.existsSync('tsconfig.json')) {
          createTsConfig();
        }
        
        // Create Jest config if it doesn't exist
        if (!fs.existsSync('jest.config.js')) {
          createJestConfig();
        }
        
        // Create ESLint config if it doesn't exist
        if (!fs.existsSync('.eslintrc.js')) {
          createEslintConfig();
        }
        
        // Create .gitignore if it doesn't exist
        if (!fs.existsSync('.gitignore')) {
          createGitignore();
        }
        
        // Initialize git if requested
        if (!options.skipGit && !fs.existsSync('.git')) {
          execSync('git init', { stdio: 'inherit' });
        }
        
        // Setup Husky
        if (!options.skipInstall) {
          spinner.text = 'Setting up pre-commit hooks...';
          execSync('npx husky install', { stdio: 'inherit' });
          execSync('npx husky add .husky/pre-commit "npx lint-staged"', { stdio: 'inherit' });
        }
        
        spinner.succeed(chalk.green('Development environment initialized!'));
        
        console.log(chalk.blue('\n✨ Setup Complete!'));
        console.log(chalk.gray('Created configuration files:'));
        console.log(chalk.gray('  • tsconfig.json - TypeScript configuration'));
        console.log(chalk.gray('  • jest.config.js - Jest testing configuration'));
        console.log(chalk.gray('  • .eslintrc.js - ESLint linting configuration'));
        console.log(chalk.gray('  • .gitignore - Git ignore patterns'));
        console.log(chalk.gray('  • .husky/pre-commit - Pre-commit hooks'));
        
      } catch (error) {
        spinner.fail(chalk.red('Setup failed'));
        console.error(error);
      }
    });
}

function createConfigCommand() {
  return new Command('config')
    .description('configure PUBG API settings')
    .option('--interactive', 'interactive configuration')
    .action(async (options) => {
      if (options.interactive) {
        await interactiveConfig();
      } else {
        await showCurrentConfig();
      }
    });
}

function createTestCommand() {
  return new Command('test')
    .description('setup and run tests')
    .option('--init', 'initialize test setup')
    .option('--watch', 'run tests in watch mode')
    .option('--coverage', 'run tests with coverage')
    .action(async (options) => {
      if (options.init) {
        await initTestSetup();
      } else {
        await runTests(options);
      }
    });
}

function createLintCommand() {
  return new Command('lint')
    .description('setup and run linting')
    .option('--init', 'initialize linting setup')
    .option('--fix', 'auto-fix linting issues')
    .action(async (options) => {
      if (options.init) {
        await initLintSetup();
      } else {
        await runLinting(options);
      }
    });
}

function createDocsCommand() {
  return new Command('docs')
    .description('setup and generate documentation')
    .option('--init', 'initialize documentation setup')
    .option('--build', 'build documentation')
    .option('--serve', 'serve documentation locally')
    .action(async (options) => {
      if (options.init) {
        await initDocsSetup();
      } else if (options.build) {
        await buildDocs();
      } else if (options.serve) {
        await serveDocs();
      }
    });
}

function createTsConfig() {
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
      allowSyntheticDefaultImports: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', '**/*.test.ts', '**/*.spec.ts', 'dist']
  };
  
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 2));
}

function createJestConfig() {
  const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
`;
  
  fs.writeFileSync('jest.config.js', jestConfig);
}

function createEslintConfig() {
  const eslintConfig = `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    '@typescript-eslint/recommended'
  ],
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  env: {
    node: true,
    jest: true
  }
};
`;
  
  fs.writeFileSync('.eslintrc.js', eslintConfig);
}

function createGitignore() {
  const gitignore = `# Dependencies
node_modules/

# Build output
dist/
build/

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

# Coverage directory
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

# Temporary files
.tmp/
temp/
`;
  
  fs.writeFileSync('.gitignore', gitignore);
}

async function interactiveConfig() {
  const questions = [
    {
      type: 'input',
      name: 'apiKey',
      message: 'PUBG API Key:',
      validate: (input: string) => input.length > 0 || 'API key is required'
    },
    {
      type: 'list',
      name: 'shard',
      message: 'Default shard:',
      choices: [
        'pc-as',
        'pc-eu',
        'pc-kakao',
        'pc-krjp',
        'pc-na',
        'pc-oc',
        'pc-ru',
        'pc-sea',
        'psn-as',
        'psn-eu',
        'psn-na',
        'psn-oc',
        'xbox-as',
        'xbox-eu',
        'xbox-na',
        'xbox-oc'
      ],
      default: 'pc-na'
    },
    {
      type: 'number',
      name: 'timeout',
      message: 'Request timeout (ms):',
      default: 10000
    },
    {
      type: 'number',
      name: 'retryAttempts',
      message: 'Retry attempts:',
      default: 3
    },
    {
      type: 'confirm',
      name: 'enableCache',
      message: 'Enable caching:',
      default: true
    }
  ];
  
  const answers = await inquirer.prompt(questions as any);
  
  // Create .env file
  const envContent = `# PUBG API Configuration
PUBG_API_KEY=${answers.apiKey}
PUBG_SHARD=${answers.shard}
PUBG_TIMEOUT=${answers.timeout}
PUBG_RETRY_ATTEMPTS=${answers.retryAttempts}
PUBG_CACHE_ENABLED=${answers.enableCache}

# Environment
NODE_ENV=development
`;
  
  fs.writeFileSync('.env', envContent);
  
  console.log(chalk.green('Configuration saved to .env file'));
}

async function showCurrentConfig() {
  if (!fs.existsSync('.env')) {
    console.log(chalk.yellow('No .env file found. Run with --interactive to create one.'));
    return;
  }
  
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log(chalk.blue('Current configuration (.env):'));
  console.log(chalk.gray(envContent));
}

async function initTestSetup() {
  const spinner = ora('Setting up test environment...').start();
  
  try {
    // Create tests directory structure
    const testDirs = ['tests', 'tests/unit', 'tests/integration', 'tests/__mocks__'];
    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Create sample test file
    const sampleTest = `import { PubgClient } from 'pubg-ts';

describe('PubgClient', () => {
  let client: PubgClient;
  
  beforeEach(() => {
    client = new PubgClient({
      apiKey: 'test-api-key',
      shard: 'pc-na'
    });
  });
  
  it('should create client instance', () => {
    expect(client).toBeDefined();
  });
  
  // Add more tests here
});
`;
    
    if (!fs.existsSync('tests/unit/client.test.ts')) {
      fs.writeFileSync('tests/unit/client.test.ts', sampleTest);
    }
    
    spinner.succeed('Test setup complete');
    console.log(chalk.blue('Created test structure:'));
    console.log(chalk.gray('  • tests/unit/ - Unit tests'));
    console.log(chalk.gray('  • tests/integration/ - Integration tests'));
    console.log(chalk.gray('  • tests/__mocks__/ - Mock files'));
    
  } catch (error) {
    spinner.fail('Test setup failed');
    console.error(error);
  }
}

async function runTests(options: any) {
  const spinner = ora('Running tests...').start();
  
  try {
    let command = 'npm test';
    
    if (options.watch) {
      command += ' -- --watch';
    }
    
    if (options.coverage) {
      command += ' -- --coverage';
    }
    
    spinner.stop();
    execSync(command, { stdio: 'inherit' });
    
  } catch (_error) {
    console.error(chalk.red('Tests failed'));
  }
}

async function initLintSetup() {
  const spinner = ora('Setting up linting...').start();
  
  try {
    // Install ESLint if not already installed
    execSync('npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser', { stdio: 'inherit' });
    
    // Create ESLint config if it doesn't exist
    if (!fs.existsSync('.eslintrc.js')) {
      createEslintConfig();
    }
    
    spinner.succeed('Linting setup complete');
    
  } catch (error) {
    spinner.fail('Linting setup failed');
    console.error(error);
  }
}

async function runLinting(options: any) {
  const spinner = ora('Running linter...').start();
  
  try {
    let command = 'npx eslint src/**/*.ts';
    
    if (options.fix) {
      command += ' --fix';
    }
    
    spinner.stop();
    execSync(command, { stdio: 'inherit' });
    
  } catch (_error) {
    console.error(chalk.red('Linting failed'));
  }
}

async function initDocsSetup() {
  const spinner = ora('Setting up documentation...').start();
  
  try {
    // Install TypeDoc if not already installed
    execSync('npm install --save-dev typedoc', { stdio: 'inherit' });
    
    // Create TypeDoc config
    const typedocConfig = {
      entryPoints: ['src/index.ts'],
      out: 'docs',
      theme: 'default',
      excludePrivate: true,
      excludeProtected: true,
      excludeExternals: true
    };
    
    fs.writeFileSync('typedoc.json', JSON.stringify(typedocConfig, null, 2));
    
    spinner.succeed('Documentation setup complete');
    
  } catch (error) {
    spinner.fail('Documentation setup failed');
    console.error(error);
  }
}

async function buildDocs() {
  const spinner = ora('Building documentation...').start();
  
  try {
    execSync('npx typedoc', { stdio: 'inherit' });
    spinner.succeed('Documentation built successfully');
    
  } catch (error) {
    spinner.fail('Documentation build failed');
    console.error(error);
  }
}

async function serveDocs() {
  console.log(chalk.blue('Starting documentation server...'));
  console.log(chalk.gray('Serving documentation at http://localhost:8080'));
  
  try {
    execSync('npx http-server docs -p 8080', { stdio: 'inherit' });
  } catch (_error) {
    console.error(chalk.red('Failed to serve documentation'));
  }
}