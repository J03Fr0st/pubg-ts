import {
  type ErrorContext,
  PubgApiError,
  PubgAssetError,
  PubgCacheError,
  PubgConfigurationError,
  PubgNetworkError,
  PubgValidationError,
} from '../../src/errors';

describe('Enhanced Error Types', () => {
  describe('PubgApiError (Base Class)', () => {
    it('should create error with enhanced context', () => {
      const error = new PubgApiError(
        'Test error',
        500,
        { data: 'test' },
        { operation: 'test_operation', metadata: { key: 'value' } }
      );

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('PubgApiError');
      expect(error.statusCode).toBe(500);
      expect(error.response).toEqual({ data: 'test' });
      expect(error.correlationId).toMatch(/^pubg-\d+-[a-z0-9]+$/);
      expect(error.timestamp).toBeGreaterThan(0);
      expect(error.context.operation).toBe('test_operation');
      expect(error.context.metadata).toEqual({ key: 'value' });
    });

    it('should generate unique correlation IDs', () => {
      const error1 = new PubgApiError('Test 1');
      const error2 = new PubgApiError('Test 2');

      expect(error1.correlationId).not.toBe(error2.correlationId);
    });

    it('should provide formatted error message', () => {
      const error = new PubgApiError('Test error');
      const formatted = error.getFormattedMessage();

      expect(formatted).toMatch(/^\[pubg-\d+-[a-z0-9]+\] PubgApiError: Test error$/);
    });

    it('should provide detailed error information', () => {
      const error = new PubgApiError(
        'Test error',
        400,
        { data: 'response' },
        { operation: 'test' }
      );

      const details = error.getDetails();

      expect(details).toMatchObject({
        name: 'PubgApiError',
        message: 'Test error',
        statusCode: 400,
        response: { data: 'response' },
        correlationId: expect.stringMatching(/^pubg-\d+-[a-z0-9]+$/),
        timestamp: expect.any(Number),
        context: expect.objectContaining({
          operation: 'test',
        }),
      });
    });

    it('should use provided correlation ID', () => {
      const customCorrelationId = 'custom-correlation-id';
      const error = new PubgApiError('Test', 200, undefined, {
        correlationId: customCorrelationId,
      });

      expect(error.correlationId).toBe(customCorrelationId);
    });

    it('should use provided timestamp', () => {
      const customTimestamp = 1234567890;
      const error = new PubgApiError('Test', 200, undefined, {
        timestamp: customTimestamp,
      });

      expect(error.timestamp).toBe(customTimestamp);
    });
  });

  describe('PubgAssetError', () => {
    it('should create asset error with proper context', () => {
      const error = new PubgAssetError('Item not found', 'Item_Weapon_AK47_C', 'item', {
        metadata: { searchTerm: 'AK47' },
      });

      expect(error.name).toBe('PubgAssetError');
      expect(error.message).toBe('Item not found');
      expect(error.assetId).toBe('Item_Weapon_AK47_C');
      expect(error.assetType).toBe('item');
      expect(error.context.operation).toBe('asset_item');
      expect(error.context.metadata).toMatchObject({
        assetId: 'Item_Weapon_AK47_C',
        assetType: 'item',
        searchTerm: 'AK47',
      });
    });

    it('should support all asset types', () => {
      const assetTypes = ['item', 'vehicle', 'map', 'season', 'survival_title', 'unknown'] as const;

      assetTypes.forEach((type) => {
        const error = new PubgAssetError(`${type} error`, `test_${type}_id`, type);

        expect(error.assetType).toBe(type);
        expect(error.context.operation).toBe(`asset_${type}`);
      });
    });

    it('should inherit from PubgApiError', () => {
      const error = new PubgAssetError('Test', 'test_id', 'item');
      expect(error).toBeInstanceOf(PubgApiError);
    });
  });

  describe('PubgCacheError', () => {
    it('should create cache error with proper context', () => {
      const error = new PubgCacheError('Cache operation failed', 'cache_key_123', 'get', {
        metadata: { size: 1024 },
      });

      expect(error.name).toBe('PubgCacheError');
      expect(error.message).toBe('Cache operation failed');
      expect(error.cacheKey).toBe('cache_key_123');
      expect(error.operation).toBe('get');
      expect(error.context.operation).toBe('cache_get');
      expect(error.context.metadata).toMatchObject({
        cacheKey: 'cache_key_123',
        cacheOperation: 'get',
        size: 1024,
      });
    });

    it('should support all cache operations', () => {
      const operations = ['get', 'set', 'delete', 'cleanup', 'eviction'] as const;

      operations.forEach((operation) => {
        const error = new PubgCacheError(`${operation} failed`, 'test_key', operation);

        expect(error.operation).toBe(operation);
        expect(error.context.operation).toBe(`cache_${operation}`);
      });
    });

    it('should inherit from PubgApiError', () => {
      const error = new PubgCacheError('Test', 'key', 'get');
      expect(error).toBeInstanceOf(PubgApiError);
    });
  });

  describe('PubgConfigurationError', () => {
    it('should create configuration error with proper context', () => {
      const error = new PubgConfigurationError('Invalid API key', 'apiKey', 'string', 123, {
        metadata: { source: 'constructor' },
      });

      expect(error.name).toBe('PubgConfigurationError');
      expect(error.message).toBe('Invalid API key');
      expect(error.configField).toBe('apiKey');
      expect(error.expectedType).toBe('string');
      expect(error.receivedValue).toBe(123);
      expect(error.context.operation).toBe('configuration_validation');
      expect(error.context.metadata).toMatchObject({
        configField: 'apiKey',
        expectedType: 'string',
        receivedValue: 'number',
        receivedValueString: '123',
        source: 'constructor',
      });
    });

    it('should handle optional parameters', () => {
      const error = new PubgConfigurationError('Generic config error', 'someField');

      expect(error.configField).toBe('someField');
      expect(error.expectedType).toBeUndefined();
      expect(error.receivedValue).toBeUndefined();
    });

    it('should inherit from PubgApiError', () => {
      const error = new PubgConfigurationError('Test', 'field');
      expect(error).toBeInstanceOf(PubgApiError);
    });
  });

  describe('PubgNetworkError', () => {
    it('should create network error with proper context', () => {
      const originalError = new Error('Connection refused');
      const error = new PubgNetworkError('Network connection failed', 'connect', originalError, {
        metadata: { host: 'api.pubg.com' },
      });

      expect(error.name).toBe('PubgNetworkError');
      expect(error.message).toBe('Network connection failed');
      expect(error.networkOperation).toBe('connect');
      expect(error.originalError).toBe(originalError);
      expect(error.context.operation).toBe('network_connect');
      expect(error.context.metadata).toMatchObject({
        networkOperation: 'connect',
        originalErrorMessage: 'Connection refused',
        originalErrorName: 'Error',
        host: 'api.pubg.com',
      });
    });

    it('should support all network operations', () => {
      const operations = ['connect', 'request', 'timeout', 'dns', 'ssl', 'unknown'] as const;

      operations.forEach((operation) => {
        const error = new PubgNetworkError(`${operation} failed`, operation);

        expect(error.networkOperation).toBe(operation);
        expect(error.context.operation).toBe(`network_${operation}`);
      });
    });

    it('should handle missing original error', () => {
      const error = new PubgNetworkError('Network error', 'unknown');

      expect(error.originalError).toBeUndefined();
      expect(error.context.metadata?.originalErrorMessage).toBeUndefined();
      expect(error.context.metadata?.originalErrorName).toBeUndefined();
    });

    it('should inherit from PubgApiError', () => {
      const error = new PubgNetworkError('Test', 'unknown');
      expect(error).toBeInstanceOf(PubgApiError);
    });
  });

  describe('PubgValidationError', () => {
    it('should create validation error with proper context', () => {
      const error = new PubgValidationError('Invalid input parameters', {
        operation: 'validate_input',
        metadata: { field: 'dateStr', value: 'invalid-date' },
      });

      expect(error.name).toBe('PubgValidationError');
      expect(error.message).toBe('Invalid input parameters');
      expect(error.statusCode).toBe(400);
      expect(error.context.operation).toBe('validate_input');
      expect(error.context.metadata).toMatchObject({
        field: 'dateStr',
        value: 'invalid-date',
      });
    });

    it('should use default message when none provided', () => {
      const error = new PubgValidationError();
      expect(error.message).toBe('Invalid request parameters');
    });

    it('should inherit from PubgApiError', () => {
      const error = new PubgValidationError('Test');
      expect(error).toBeInstanceOf(PubgApiError);
    });
  });

  describe('Error Context Interface', () => {
    it('should support all context properties', () => {
      const context: ErrorContext = {
        correlationId: 'test-correlation-id',
        timestamp: 1234567890,
        operation: 'test_operation',
        metadata: { key: 'value' },
        stack: 'Error stack trace',
      };

      const error = new PubgApiError('Test', 200, undefined, context);

      expect(error.context).toMatchObject(context);
    });

    it('should work with partial context', () => {
      const context: Partial<ErrorContext> = {
        operation: 'partial_test',
        metadata: { partial: true },
      };

      const error = new PubgApiError('Test', 200, undefined, context);

      expect(error.context.operation).toBe('partial_test');
      expect(error.context.metadata).toMatchObject({ partial: true });
      expect(error.context.correlationId).toBeDefined();
      expect(error.context.timestamp).toBeDefined();
    });
  });

  describe('Error Serialization', () => {
    it('should serialize error details properly', () => {
      const error = new PubgAssetError('Test asset error', 'Item_Test_C', 'item', {
        metadata: { source: 'test' },
      });

      const details = error.getDetails();
      const serialized = JSON.stringify(details);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.name).toBe('PubgAssetError');
      expect(deserialized.message).toBe('Test asset error');
      expect(deserialized.correlationId).toBeDefined();
      expect(deserialized.context.metadata.assetId).toBe('Item_Test_C');
      expect(deserialized.context.metadata.source).toBe('test');
    });

    it('should handle circular references in response data', () => {
      const circularResponse: any = { data: 'test' };
      circularResponse.self = circularResponse;

      const error = new PubgApiError('Test', 200, circularResponse);
      const details = error.getDetails();

      expect(details.response).toBeDefined();
      expect(details.response.data).toBe('test');
    });
  });
});
