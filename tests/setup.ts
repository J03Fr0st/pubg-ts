import 'jest';
import 'dotenv/config';

// Load test environment if available
try {
  require('dotenv').config({ path: '.env.test' });
} catch (_error) {
  // .env.test is optional
}

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test teardown
afterEach(() => {
  // Clear any timers that might be hanging
  jest.clearAllTimers();
});

afterAll(async () => {
  // Clean up monitoring system if it exists
  try {
    const { monitoringSystem } = require('../src/utils/monitoring');
    if (monitoringSystem && typeof monitoringSystem.cleanup === 'function') {
      monitoringSystem.cleanup();
    }
  } catch (_error) {
    // Ignore cleanup errors in tests
  }

  // Wait for any pending promises/timers to complete
  await new Promise((resolve) => setTimeout(resolve, 50));
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
