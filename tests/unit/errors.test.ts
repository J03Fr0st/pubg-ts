import {
  PubgApiError,
  PubgAuthenticationError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../src/errors';

describe('Error Classes', () => {
  describe('PubgApiError', () => {
    it('should create error with message and status code', () => {
      const error = new PubgApiError('Test error', 500, { test: 'data' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.response).toEqual({ test: 'data' });
      expect(error.name).toBe('PubgApiError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with only message', () => {
      const error = new PubgApiError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBeUndefined();
      expect(error.response).toBeUndefined();
    });
  });

  describe('PubgRateLimitError', () => {
    it('should create rate limit error with default message', () => {
      const error = new PubgRateLimitError();

      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('PubgRateLimitError');
      expect(error instanceof PubgApiError).toBe(true);
    });

    it('should create rate limit error with custom message and retry after', () => {
      const error = new PubgRateLimitError('Custom message', 60);

      expect(error.message).toBe('Custom message');
      expect(error.retryAfter).toBe(60);
      expect(error.statusCode).toBe(429);
    });
  });

  describe('PubgAuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new PubgAuthenticationError('Invalid API key');

      expect(error.message).toBe('Invalid API key');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('PubgAuthenticationError');
      expect(error instanceof PubgApiError).toBe(true);
    });
  });

  describe('PubgNotFoundError', () => {
    it('should create not found error', () => {
      const error = new PubgNotFoundError('Player not found');

      expect(error.message).toBe('Player not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('PubgNotFoundError');
      expect(error instanceof PubgApiError).toBe(true);
    });
  });

  describe('PubgValidationError', () => {
    it('should create validation error', () => {
      const error = new PubgValidationError('Invalid parameters');

      expect(error.message).toBe('Invalid parameters');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('PubgValidationError');
      expect(error instanceof PubgApiError).toBe(true);
    });
  });
});
