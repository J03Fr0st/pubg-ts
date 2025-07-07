import 'jest';
import 'dotenv/config';

// Load test environment if available
try {
  require('dotenv').config({ path: '.env.test' });
} catch (error) {
  // .env.test is optional
}

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Only mock console for non-integration tests
if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
  // Mock console methods to avoid noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
