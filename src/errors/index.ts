/**
 * Enhanced error context interface for better debugging
 */
export interface ErrorContext {
  correlationId?: string;
  timestamp?: number;
  operation?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

/**
 * Base PUBG API error class with enhanced context support
 */
export class PubgApiError extends Error {
  public readonly correlationId: string;
  public readonly timestamp: number;
  public readonly context: ErrorContext;

  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    context: Partial<ErrorContext> = {}
  ) {
    super(message);
    this.name = 'PubgApiError';
    this.correlationId = context.correlationId || this.generateCorrelationId();
    this.timestamp = context.timestamp || Date.now();
    this.context = {
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      operation: context.operation,
      metadata: context.metadata || {},
      stack: this.stack,
      ...context,
    };
    Object.setPrototypeOf(this, PubgApiError.prototype);
  }

  /**
   * Generate a unique correlation ID for error tracking
   */
  private generateCorrelationId(): string {
    return `pubg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get detailed error information for debugging
   */
  getDetails(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      context: this.context,
      response: this.response,
    };
  }

  /**
   * Get a formatted error message with context
   */
  getFormattedMessage(): string {
    return `[${this.correlationId}] ${this.name}: ${this.message}`;
  }
}

export class PubgRateLimitError extends PubgApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, 429, undefined, { ...context, operation: context.operation || 'rate_limit' });
    this.name = 'PubgRateLimitError';
    Object.setPrototypeOf(this, PubgRateLimitError.prototype);
  }
}

export class PubgAuthenticationError extends PubgApiError {
  constructor(message: string = 'Authentication failed', context: Partial<ErrorContext> = {}) {
    super(message, 401, undefined, {
      ...context,
      operation: context.operation || 'authentication',
    });
    this.name = 'PubgAuthenticationError';
    Object.setPrototypeOf(this, PubgAuthenticationError.prototype);
  }
}

export class PubgNotFoundError extends PubgApiError {
  constructor(message: string = 'Resource not found', context: Partial<ErrorContext> = {}) {
    super(message, 404, undefined, {
      ...context,
      operation: context.operation || 'resource_lookup',
    });
    this.name = 'PubgNotFoundError';
    Object.setPrototypeOf(this, PubgNotFoundError.prototype);
  }
}

export class PubgValidationError extends PubgApiError {
  constructor(message: string = 'Invalid request parameters', context: Partial<ErrorContext> = {}) {
    super(message, 400, undefined, { ...context, operation: context.operation || 'validation' });
    this.name = 'PubgValidationError';
    Object.setPrototypeOf(this, PubgValidationError.prototype);
  }
}

/**
 * Cache-related error for cache operations
 */
export class PubgCacheError extends PubgApiError {
  constructor(
    message: string,
    public cacheKey: string,
    public operation: 'get' | 'set' | 'delete' | 'cleanup' | 'eviction',
    context: Partial<ErrorContext> = {}
  ) {
    super(message, 0, undefined, {
      ...context,
      operation: `cache_${operation}`,
      metadata: { cacheKey, cacheOperation: operation, ...context.metadata },
    });
    this.name = 'PubgCacheError';
    Object.setPrototypeOf(this, PubgCacheError.prototype);
  }
}

/**
 * Asset management related errors
 */
export class PubgAssetError extends PubgApiError {
  constructor(
    message: string,
    public assetId: string,
    public assetType: 'item' | 'vehicle' | 'map' | 'season' | 'survival_title' | 'unknown',
    context: Partial<ErrorContext> = {}
  ) {
    super(message, 0, undefined, {
      ...context,
      operation: `asset_${assetType}`,
      metadata: { assetId, assetType, ...context.metadata },
    });
    this.name = 'PubgAssetError';
    Object.setPrototypeOf(this, PubgAssetError.prototype);
  }
}

/**
 * Configuration validation errors
 */
export class PubgConfigurationError extends PubgApiError {
  constructor(
    message: string,
    public configField: string,
    public expectedType?: string,
    public receivedValue?: any,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, 0, undefined, {
      ...context,
      operation: 'configuration_validation',
      metadata: {
        configField,
        expectedType,
        receivedValue: typeof receivedValue,
        receivedValueString: String(receivedValue),
        ...context.metadata,
      },
    });
    this.name = 'PubgConfigurationError';
    Object.setPrototypeOf(this, PubgConfigurationError.prototype);
  }
}

/**
 * Network connectivity and communication errors
 */
export class PubgNetworkError extends PubgApiError {
  constructor(
    message: string,
    public networkOperation: 'connect' | 'request' | 'timeout' | 'dns' | 'ssl' | 'unknown',
    public originalError?: Error,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, 0, undefined, {
      ...context,
      operation: `network_${networkOperation}`,
      metadata: {
        networkOperation,
        originalErrorMessage: originalError?.message,
        originalErrorName: originalError?.name,
        ...context.metadata,
      },
    });
    this.name = 'PubgNetworkError';
    Object.setPrototypeOf(this, PubgNetworkError.prototype);
  }
}
