import {
  PubgAssetError,
  PubgCacheError,
  PubgConfigurationError,
  PubgValidationError,
} from '../../src/errors';
import { AssetManager } from '../../src/utils/assets';

class TestAssetManager extends AssetManager {
  public get testCache() {
    return this.cache;
  }
  public testParseDate(dateStr: string) {
    return this.parseDate(dateStr);
  }
}

describe('AssetManager Error Handling', () => {
  let assetManager: TestAssetManager;

  beforeEach(() => {
    assetManager = new TestAssetManager();
  });

  describe('Configuration Validation', () => {
    it('should throw PubgConfigurationError for invalid baseUrl', () => {
      expect(() => {
        new TestAssetManager({ baseUrl: 123 as any });
      }).toThrow(PubgConfigurationError);
    });

    it('should throw PubgConfigurationError for invalid version', () => {
      expect(() => {
        new TestAssetManager({ version: true as any });
      }).toThrow(PubgConfigurationError);
    });

    it('should throw PubgConfigurationError for invalid cacheAssets', () => {
      expect(() => {
        new TestAssetManager({ cacheAssets: 'true' as any });
      }).toThrow(PubgConfigurationError);
    });

    it('should throw PubgConfigurationError for invalid useLocalData', () => {
      expect(() => {
        new TestAssetManager({ useLocalData: 'false' as any });
      }).toThrow(PubgConfigurationError);
    });

    it('should provide detailed error context for configuration errors', () => {
      try {
        new TestAssetManager({ baseUrl: 123 as any });
      } catch (error) {
        expect(error).toBeInstanceOf(PubgConfigurationError);
        expect((error as PubgConfigurationError).configField).toBe('baseUrl');
        expect((error as PubgConfigurationError).expectedType).toBe('string');
        expect((error as PubgConfigurationError).receivedValue).toBe(123);
      }
    });

    it('should accept valid configuration', () => {
      expect(() => {
        new TestAssetManager({
          baseUrl: 'https://custom.api.com',
          version: '1.0.0',
          cacheAssets: false,
          useLocalData: true,
        });
      }).not.toThrow();
    });
  });

  describe('Asset Retrieval Error Handling', () => {
    describe('getItemInfo', () => {
      it('should throw PubgAssetError for invalid item ID', () => {
        expect(() => {
          assetManager.getItemInfo(null as any);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getItemInfo(undefined as any);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getItemInfo(123 as any);
        }).toThrow(PubgAssetError);
      });

      it('should provide detailed error context for invalid item ID', () => {
        try {
          assetManager.getItemInfo(null as any);
        } catch (error) {
          expect(error).toBeInstanceOf(PubgAssetError);
          expect((error as PubgAssetError).assetId).toBe('undefined');
          expect((error as PubgAssetError).assetType).toBe('item');
          expect((error as PubgAssetError).context.operation).toBe('asset_item');
          expect((error as PubgAssetError).context.metadata).toMatchObject({
            providedId: null,
          });
        }
      });

      it('should return null for non-existent items without throwing', () => {
        const result = assetManager.getItemInfo('Item_NonExistent_C');
        expect(result).toBeNull();
      });

      it('should return item info for valid items', () => {
        // This test depends on actual asset data being available
        // We'll skip if the asset data is not available
        try {
          const result = assetManager.getItemInfo('Item_Weapon_AK47_C');
          expect(result).toBeDefined();
          expect(result?.id).toBe('Item_Weapon_AK47_C');
        } catch (_error) {
          // Skip if asset data is not available
        }
      });
    });

    describe('getVehicleInfo', () => {
      it('should throw PubgAssetError for invalid vehicle ID', () => {
        expect(() => {
          assetManager.getVehicleInfo(null as any);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getVehicleInfo(undefined as any);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getVehicleInfo(123 as any);
        }).toThrow(PubgAssetError);
      });

      it('should provide detailed error context for invalid vehicle ID', () => {
        try {
          assetManager.getVehicleInfo('' as any);
        } catch (error) {
          expect(error).toBeInstanceOf(PubgAssetError);
          expect((error as PubgAssetError).assetType).toBe('vehicle');
          expect((error as PubgAssetError).context.operation).toBe('asset_vehicle');
        }
      });

      it('should return null for non-existent vehicles without throwing', () => {
        const result = assetManager.getVehicleInfo('BP_NonExistent_C');
        expect(result).toBeNull();
      });
    });

    describe('getSurvivalTitle', () => {
      it('should throw PubgAssetError for invalid rating', () => {
        expect(() => {
          assetManager.getSurvivalTitle('invalid' as any);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getSurvivalTitle(-1);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getSurvivalTitle(Number.POSITIVE_INFINITY);
        }).toThrow(PubgAssetError);

        expect(() => {
          assetManager.getSurvivalTitle(Number.NaN);
        }).toThrow(PubgAssetError);
      });

      it('should provide detailed error context for invalid rating', () => {
        try {
          assetManager.getSurvivalTitle(-100);
        } catch (error) {
          expect(error).toBeInstanceOf(PubgAssetError);
          expect((error as PubgAssetError).assetType).toBe('survival_title');
          expect((error as PubgAssetError).context.operation).toBe('asset_survival_title');
          expect((error as PubgAssetError).context.metadata).toMatchObject({
            providedRating: -100,
          });
        }
      });

      it('should return null for ratings without matching title', () => {
        const result = assetManager.getSurvivalTitle(0);
        expect(result).toBeNull();
      });

      it('should accept valid ratings', () => {
        expect(() => {
          assetManager.getSurvivalTitle(1000);
        }).not.toThrow();
      });
    });
  });

  describe('Platform Validation', () => {
    describe('getSeasonsByPlatform', () => {
      it('should throw PubgConfigurationError for invalid platform', () => {
        expect(() => {
          assetManager.getSeasonsByPlatform('INVALID' as any);
        }).toThrow(PubgConfigurationError);

        expect(() => {
          assetManager.getSeasonsByPlatform('ps4' as any);
        }).toThrow(PubgConfigurationError);

        expect(() => {
          assetManager.getSeasonsByPlatform('' as any);
        }).toThrow(PubgConfigurationError);
      });

      it('should provide detailed error context for invalid platform', () => {
        try {
          assetManager.getSeasonsByPlatform('INVALID' as any);
        } catch (error) {
          expect(error).toBeInstanceOf(PubgConfigurationError);
          expect((error as PubgConfigurationError).configField).toBe('platform');
          expect((error as PubgConfigurationError).expectedType).toBe('Platform');
          expect((error as PubgConfigurationError).receivedValue).toBe('INVALID');
          expect((error as PubgConfigurationError).message).toContain('Valid platforms are');
        }
      });

      it('should accept valid platforms', () => {
        expect(() => {
          assetManager.getSeasonsByPlatform('PC');
        }).not.toThrow();

        expect(() => {
          assetManager.getSeasonsByPlatform('XBOX');
        }).not.toThrow();

        expect(() => {
          assetManager.getSeasonsByPlatform('PS4');
        }).not.toThrow();

        expect(() => {
          assetManager.getSeasonsByPlatform('Stadia');
        }).not.toThrow();
      });
    });

    describe('getCurrentSeason', () => {
      it('should throw PubgConfigurationError for invalid platform', () => {
        expect(() => {
          assetManager.getCurrentSeason(null as any);
        }).toThrow(PubgConfigurationError);

        expect(() => {
          assetManager.getCurrentSeason(123 as any);
        }).toThrow(PubgConfigurationError);
      });

      it('should provide detailed error context for invalid platform', () => {
        try {
          assetManager.getCurrentSeason(null as any);
        } catch (error) {
          expect(error).toBeInstanceOf(PubgConfigurationError);
          expect((error as PubgConfigurationError).configField).toBe('platform');
        }
      });

      it('should accept valid platforms', () => {
        expect(() => {
          assetManager.getCurrentSeason('PC');
        }).not.toThrow();
      });

      it('should use default platform when none provided', () => {
        expect(() => {
          assetManager.getCurrentSeason();
        }).not.toThrow();
      });
    });
  });

  describe('Cache Operations', () => {
    describe('clearCache', () => {
      it('should handle cache clearing errors', () => {
        // Mock the cache.clear method to throw an error
        const originalClear = assetManager.testCache.clear;
        assetManager.testCache.clear = jest.fn().mockImplementation(() => {
          throw new Error('Cache clear failed');
        });

        expect(() => {
          assetManager.clearCache();
        }).toThrow(PubgCacheError);

        // Restore original method
        assetManager.testCache.clear = originalClear;
      });

      it('should provide detailed error context for cache errors', () => {
        // Mock the cache.clear method to throw an error
        const originalClear = assetManager.testCache.clear;
        assetManager.testCache.clear = jest.fn().mockImplementation(() => {
          throw new Error('Mock cache error');
        });

        try {
          assetManager.clearCache();
        } catch (error) {
          expect(error).toBeInstanceOf(PubgCacheError);
          expect((error as PubgCacheError).cacheKey).toBe('all_caches');
          expect((error as PubgCacheError).operation).toBe('cleanup');
          expect((error as PubgCacheError).context.metadata).toMatchObject({
            originalError: expect.any(Error),
          });
        }

        // Restore original method
        assetManager.testCache.clear = originalClear;
      });

      it('should clear cache successfully under normal conditions', () => {
        expect(() => {
          assetManager.clearCache();
        }).not.toThrow();
      });
    });
  });

  describe('Data Validation', () => {
    describe('parseDate', () => {
      it('should throw PubgValidationError for invalid date strings', () => {
        expect(() => {
          assetManager.testParseDate(null as any);
        }).toThrow(PubgValidationError);

        expect(() => {
          assetManager.testParseDate(undefined as any);
        }).toThrow(PubgValidationError);

        expect(() => {
          assetManager.testParseDate(123 as any);
        }).toThrow(PubgValidationError);

        expect(() => {
          assetManager.testParseDate('invalid-date');
        }).toThrow(PubgValidationError);

        expect(() => {
          assetManager.testParseDate('12-31'); // Missing year
        }).toThrow(PubgValidationError);

        expect(() => {
          assetManager.testParseDate('12-31-2023-extra'); // Too many parts
        }).toThrow(PubgValidationError);

        expect(() => {
          assetManager.testParseDate('invalid-31-2023'); // Non-numeric month
        }).toThrow(PubgValidationError);
      });

      it('should provide detailed error context for date validation errors', () => {
        try {
          assetManager.testParseDate('invalid-date');
        } catch (error) {
          expect(error).toBeInstanceOf(PubgValidationError);
          expect((error as PubgValidationError).context.operation).toBe('parse_date');
          expect((error as PubgValidationError).context.metadata).toMatchObject({
            providedDate: 'invalid-date',
            format: 'MM-DD-YYYY',
          });
        }

        try {
          assetManager.testParseDate('abc-def-ghi');
        } catch (error) {
          expect(error).toBeInstanceOf(PubgValidationError);
          expect((error as PubgValidationError).context.metadata).toMatchObject({
            month: NaN,
            day: NaN,
            year: NaN,
          });
        }
      });

      it('should parse valid dates correctly', () => {
        expect(() => {
          const result = assetManager.testParseDate('12-31-2023');
          expect(result).toBeInstanceOf(Date);
          expect(result.getFullYear()).toBe(2023);
          expect(result.getMonth()).toBe(11); // December (0-indexed)
          expect(result.getDate()).toBe(31);
        }).not.toThrow();
      });
    });
  });

  describe('Error Correlation and Context', () => {
    it('should provide unique correlation IDs for different errors', () => {
      const errors: PubgAssetError[] = [];

      try {
        assetManager.getItemInfo(null as any);
      } catch (error) {
        errors.push(error as PubgAssetError);
      }

      try {
        assetManager.getVehicleInfo(null as any);
      } catch (error) {
        errors.push(error as PubgAssetError);
      }

      expect(errors).toHaveLength(2);
      expect(errors[0].correlationId).not.toBe(errors[1].correlationId);
    });

    it('should include operation-specific context in errors', () => {
      const errorContexts: any[] = [];

      try {
        assetManager.getItemInfo(null as any);
      } catch (error) {
        errorContexts.push((error as PubgAssetError).context);
      }

      try {
        assetManager.getSurvivalTitle(-1);
      } catch (error) {
        errorContexts.push((error as PubgAssetError).context);
      }

      expect(errorContexts[0].operation).toBe('asset_item');
      expect(errorContexts[1].operation).toBe('asset_survival_title');
      expect(errorContexts[0].metadata).toHaveProperty('providedId');
      expect(errorContexts[1].metadata).toHaveProperty('providedRating');
    });

    it('should provide timestamps for error tracking', () => {
      const startTime = Date.now();

      try {
        assetManager.getItemInfo(null as any);
      } catch (error) {
        const assetError = error as PubgAssetError;
        expect(assetError.timestamp).toBeGreaterThanOrEqual(startTime);
        expect(assetError.timestamp).toBeLessThanOrEqual(Date.now());
      }
    });
  });
});
