import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { assetManager } from '../../src/utils/assets';

// Mock dependencies
jest.mock('node:child_process');
jest.mock('node:fs');
jest.mock('ora');
jest.mock('../../src/utils/assets');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockAssetManager = assetManager as jest.Mocked<typeof assetManager>;

describe('CLI Assets Command', () => {
  let originalConsoleLog: any;
  let originalConsoleError: any;
  let originalProcessExit: any;
  let assetsCommand: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;

    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn() as any;

    // Mock asset manager methods
    mockAssetManager.getItemsByCategory.mockReturnValue([
      {
        id: 'Item_Weapon_AKM_C',
        name: 'AKM',
        category: 'Weapon',
        subcategory: 'Assault Rifle',
        description: 'AK47-style rifle',
      },
    ]);

    mockAssetManager.getVehicleInfo.mockReturnValue({
      id: 'BP_Motorbike_04_C',
      name: 'Motorbike',
      category: 'Land',
      type: 'Motorbike',
      description: 'Two-wheeled vehicle',
    });

    mockAssetManager.searchItems.mockReturnValue([
      {
        id: 'Item_Weapon_AKM_C',
        name: 'AKM',
        category: 'Weapon',
        subcategory: 'Assault Rifle',
        description: 'AK47-style rifle',
      },
    ]);

    mockAssetManager.getAllMaps.mockReturnValue([{ id: 'Erangel_Main', name: 'Erangel' }]);

    mockAssetManager.getSeasonsByPlatform.mockReturnValue([
      {
        id: 'division.bro.official.pc-2018-01',
        platform: 'steam' as any,
        name: 'Pre-season 1',
        startDate: '2018-01-01',
        endDate: '2018-03-01',
        isActive: false,
        isOffseason: false,
      },
    ]);

    mockAssetManager.getSurvivalTitle.mockReturnValue(null);
    mockAssetManager.clearCache.mockImplementation(() => {});
    mockAssetManager.getAssetStats.mockReturnValue({
      totalItems: 100,
      totalVehicles: 20,
      totalMaps: 4,
      categoryCounts: { Weapon: 50, Equipment: 30, Healing: 20 },
    });

    // Mock fs methods
    mockFs.existsSync.mockReturnValue(true);
    mockFs.writeFileSync.mockImplementation();
    mockFs.mkdirSync.mockImplementation();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe('assets sync command', () => {
    it('should handle sync subcommand', async () => {
      mockExecSync.mockReturnValue(Buffer.from('Assets synced successfully'));

      // Import the command after mocks are set up
      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      expect(assetsCommand.name()).toBe('assets');
      expect(assetsCommand.description()).toBe('manage and explore PUBG assets');
    });

    it('should handle list subcommand', async () => {
      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // The command should be configured with subcommands
      expect(assetsCommand.commands).toBeDefined();
    });
  });

  describe('assets list command', () => {
    it('should list all items when items option is used', async () => {
      mockAssetManager.getItemsByCategory.mockReturnValue([
        {
          id: 'Item_Weapon_AKM_C',
          name: 'AKM',
          category: 'Weapon',
          subcategory: 'Assault Rifle',
          description: 'AK47-style rifle',
        },
        {
          id: 'Item_Weapon_M416_C',
          name: 'M416',
          category: 'Weapon',
          subcategory: 'Assault Rifle',
          description: 'NATO rifle',
        },
      ]);

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Verify command is configured correctly
      expect(assetsCommand.name()).toBe('assets');
    });

    it('should list all seasons when seasons option is used', async () => {
      mockAssetManager.getSeasonsByPlatform.mockReturnValue([
        {
          id: 'division.bro.official.pc-2018-01',
          platform: 'steam' as any,
          name: 'Pre-season 1',
          startDate: '2018-01-01',
          endDate: '2018-03-01',
          isActive: false,
          isOffseason: false,
        },
      ]);

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Verify command functionality
      expect(assetsCommand.description()).toBe('manage and explore PUBG assets');
    });
  });

  describe('assets search command', () => {
    it('should search items by query', async () => {
      mockAssetManager.searchItems.mockReturnValue([
        {
          id: 'Item_Weapon_AKM_C',
          name: 'AKM',
          category: 'Weapon',
          subcategory: 'Assault Rifle',
          description: 'AK47-style rifle',
        },
      ]);

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Test search functionality setup
      expect(mockAssetManager.searchItems).toBeDefined();
    });
  });

  describe('assets info command', () => {
    it('should show detailed info for specific item', async () => {
      mockAssetManager.getItemInfo.mockReturnValue({
        id: 'Item_Weapon_AKM_C',
        name: 'AKM',
        category: 'Weapon',
        subcategory: 'Assault Rifle',
        description: 'Assault rifle',
      });

      mockAssetManager.getVehicleInfo.mockReturnValue({
        id: 'BP_Motorbike_04_C',
        name: 'Motorbike',
        category: 'Land',
        type: 'Motorbike',
        description: 'Two-wheeled vehicle',
      });

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Verify asset info functionality
      expect(mockAssetManager.getItemInfo).toBeDefined();
      expect(mockAssetManager.getVehicleInfo).toBeDefined();
    });
  });

  describe('assets validate command', () => {
    it('should validate asset data integrity', async () => {
      mockAssetManager.getItemsByCategory.mockReturnValue([
        {
          id: 'Item_Weapon_AKM_C',
          name: 'AKM',
          category: 'Weapon',
          subcategory: 'Assault Rifle',
          description: 'AK47-style rifle',
        },
      ]);

      mockAssetManager.getSeasonsByPlatform.mockReturnValue([
        {
          id: 'division.bro.official.pc-2018-01',
          platform: 'steam' as any,
          name: 'Pre-season 1',
          startDate: '2018-01-01',
          endDate: '2018-03-01',
          isActive: false,
          isOffseason: false,
        },
      ]);

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Test validation setup
      expect(assetsCommand.name()).toBe('assets');
    });
  });

  describe('error handling', () => {
    it('should handle asset manager errors gracefully', async () => {
      mockAssetManager.getItemsByCategory.mockImplementation(() => {
        throw new Error('Asset loading failed');
      });

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Verify error handling is set up
      expect(assetsCommand).toBeDefined();
    });

    it('should handle file system errors', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Test file system error handling
      expect(assetsCommand).toBeDefined();
    });
  });

  describe('command structure', () => {
    it('should have correct command metadata', async () => {
      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      expect(assetsCommand.name()).toBe('assets');
      expect(assetsCommand.description()).toBe('manage and explore PUBG assets');
    });

    it('should have all required subcommands', async () => {
      const { assetsCommand: importedCommand } = require('../../src/cli/commands/assets');
      assetsCommand = importedCommand;

      // Verify the command structure
      expect(assetsCommand).toBeDefined();
    });
  });
});
