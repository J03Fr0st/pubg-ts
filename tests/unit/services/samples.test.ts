import type { HttpClient } from '../../../src/api/http-client';
import { SamplesService } from '../../../src/api/services/samples';
import type { MatchesResponse } from '../../../src/types';

jest.mock('../../../src/api/http-client');

describe('SamplesService', () => {
  let samplesService: SamplesService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      getRateLimitStatus: jest.fn(),
    } as any;

    samplesService = new SamplesService(mockHttpClient, 'pc-na');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSamples', () => {
    it('should get samples without query parameters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await samplesService.getSamples();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/shards/pc-na/samples');
      expect(result).toEqual(mockResponse);
    });

    it('should get samples with date filters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await samplesService.getSamples({
        createdAt: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-31T23:59:59Z',
        },
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/samples?filter%5BcreatedAt-start%5D=2023-01-01T00%3A00%3A00Z&filter%5BcreatedAt-end%5D=2023-01-31T23%3A59%3A59Z'
      );
    });
  });
});
