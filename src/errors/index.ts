export class PubgApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'PubgApiError';
    Object.setPrototypeOf(this, PubgApiError.prototype);
  }
}

export class PubgRateLimitError extends PubgApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'PubgRateLimitError';
    Object.setPrototypeOf(this, PubgRateLimitError.prototype);
  }
}

export class PubgAuthenticationError extends PubgApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'PubgAuthenticationError';
    Object.setPrototypeOf(this, PubgAuthenticationError.prototype);
  }
}

export class PubgNotFoundError extends PubgApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'PubgNotFoundError';
    Object.setPrototypeOf(this, PubgNotFoundError.prototype);
  }
}

export class PubgValidationError extends PubgApiError {
  constructor(message: string = 'Invalid request parameters') {
    super(message, 400);
    this.name = 'PubgValidationError';
    Object.setPrototypeOf(this, PubgValidationError.prototype);
  }
}