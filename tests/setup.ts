import 'jest';

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
