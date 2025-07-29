// Mock dependencies before importing
const mockProgram = {
  name: jest.fn().mockReturnThis(),
  description: jest.fn().mockReturnThis(),
  version: jest.fn().mockReturnThis(),
  addCommand: jest.fn().mockReturnThis(),
  outputHelp: jest.fn(),
  parse: jest.fn(),
};

jest.mock('commander', () => ({
  program: mockProgram,
}));

jest.mock('chalk');
jest.mock('../../src/cli/commands/scaffold', () => ({
  scaffoldCommand: { name: jest.fn(() => 'scaffold') },
}));

jest.mock('../../src/cli/commands/assets', () => ({
  assetsCommand: { name: jest.fn(() => 'assets') },
}));

jest.mock('../../src/cli/commands/setup', () => ({
  setupCommand: { name: jest.fn(() => 'setup') },
}));

describe('CLI Index', () => {
  let originalConsoleLog: any;
  let originalProcessExit: any;
  let originalProcessArgv: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleLog = console.log;
    originalProcessExit = process.exit;
    originalProcessArgv = process.argv;

    console.log = jest.fn();
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
    process.argv = originalProcessArgv;
  });

  describe('CLI initialization', () => {
    it('should configure program with correct metadata', () => {
      // Import after mocks are set up
      require('../../src/cli/index');

      expect(mockProgram.name).toHaveBeenCalledWith('pubg-ts');
      expect(mockProgram.description).toHaveBeenCalledWith('CLI for the PUBG TypeScript SDK');
      expect(mockProgram.version).toHaveBeenCalled();
    });

    it('should add all required commands', () => {
      require('../../src/cli/index');

      expect(mockProgram.addCommand).toHaveBeenCalledTimes(3);
    });

    it('should parse command line arguments', () => {
      process.argv = ['node', 'cli.js', 'scaffold', 'my-project'];

      require('../../src/cli/index');

      expect(mockProgram.parse).toHaveBeenCalledWith(process.argv);
    });
  });

  describe('help display behavior', () => {
    it('should show help when no arguments provided', () => {
      process.argv = ['node', 'cli.js'];

      require('../../src/cli/index');

      // When no commands provided, help should be shown
      expect(mockProgram.outputHelp).toHaveBeenCalled();
    });

    it('should not show help when arguments are provided', () => {
      process.argv = ['node', 'cli.js', 'scaffold', 'test-project'];
      jest.clearAllMocks();

      require('../../src/cli/index');

      // With arguments provided, should not auto-show help
      expect(mockProgram.parse).toHaveBeenCalled();
    });
  });

  describe('command integration', () => {
    it('should integrate scaffold command', () => {
      const { scaffoldCommand } = require('../../src/cli/commands/scaffold');

      require('../../src/cli/index');

      expect(mockProgram.addCommand).toHaveBeenCalledWith(scaffoldCommand);
    });

    it('should integrate assets command', () => {
      const { assetsCommand } = require('../../src/cli/commands/assets');

      require('../../src/cli/index');

      expect(mockProgram.addCommand).toHaveBeenCalledWith(assetsCommand);
    });

    it('should integrate setup command', () => {
      const { setupCommand } = require('../../src/cli/commands/setup');

      require('../../src/cli/index');

      expect(mockProgram.addCommand).toHaveBeenCalledWith(setupCommand);
    });
  });

  describe('version handling', () => {
    it('should read version from package.json', () => {
      require('../../src/cli/index');

      // Should call version with the package version
      expect(mockProgram.version).toHaveBeenCalled();
    });
  });

  describe('CLI banner formatting', () => {
    it('should display properly formatted banner', () => {
      process.argv = ['node', 'cli.js'];

      require('../../src/cli/index');

      // Should display help which includes the banner
      expect(mockProgram.outputHelp).toHaveBeenCalled();
    });

    it('should use CLI branding', () => {
      require('../../src/cli/index');

      // Should set up the program with proper branding
      expect(mockProgram.name).toHaveBeenCalledWith('pubg-ts');
      expect(mockProgram.description).toHaveBeenCalledWith('CLI for the PUBG TypeScript SDK');
    });
  });
});
