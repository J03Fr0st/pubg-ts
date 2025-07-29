module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/example.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 20000,
  // Force Jest to exit after tests complete
  forceExit: true,
  // Handle ESM modules for CLI dependencies
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['node_modules/(?!(chalk|inquirer|ora|commander)/)'],
  // Mock problematic ESM modules
  moduleNameMapper: {
    '^chalk$': '<rootDir>/tests/__mocks__/chalk.js',
    '^inquirer$': '<rootDir>/tests/__mocks__/inquirer.js',
    '^ora$': '<rootDir>/tests/__mocks__/ora.js',
  },
};
