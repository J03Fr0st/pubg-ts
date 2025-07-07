import type { HttpClient } from '../../../src/api/http-client';
import { SeasonsService } from '../../../src/api/services/seasons';
import type { SeasonsResponse } from '../../../src/types';

jest.mock('../../../src/api/http-client');

describe('SeasonsService', () => {
  let seasonsService: SeasonsService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      getRateLimitStatus: jest.fn(),
    } as any;

    seasonsService = new SeasonsService(mockHttpClient, 'pc-na');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSeasons', () => {
    it('should get all seasons', async () => {
      const mockResponse: SeasonsResponse = {
        data: [
          {
            type: 'season',
            id: 'season-1',
            attributes: {
              isCurrentSeason: false,
              isOffseason: false,
            },
            relationships: {},
          },
          {
            type: 'season',
            id: 'season-2',
            attributes: {
              isCurrentSeason: true,
              isOffseason: false,
            },
            relationships: {},
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await seasonsService.getSeasons();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/shards/pc-na/seasons');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentSeason', () => {
    it('should get current season', async () => {
      const mockResponse: SeasonsResponse = {
        data: [
          {
            type: 'season',
            id: 'season-1',
            attributes: {
              isCurrentSeason: false,
              isOffseason: false,
            },
            relationships: {},
          },
          {
            type: 'season',
            id: 'season-2',
            attributes: {
              isCurrentSeason: true,
              isOffseason: false,
            },
            relationships: {},
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await seasonsService.getCurrentSeason();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/shards/pc-na/seasons');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].attributes.isCurrentSeason).toBe(true);
    });

    it('should throw error if no current season found', async () => {
      const mockResponse: SeasonsResponse = {
        data: [
          {
            type: 'season',
            id: 'season-1',
            attributes: {
              isCurrentSeason: false,
              isOffseason: false,
            },
            relationships: {},
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      await expect(seasonsService.getCurrentSeason()).rejects.toThrow('No current season found');
    });
  });
});
