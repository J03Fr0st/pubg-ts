import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { Seasons } from '../../../src/api/services/seasons';
import type { SeasonsResponse } from '../../../src/types';

describe('Seasons', () => {
  let seasons: Seasons;
  let transport: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    transport = {
      get: jest.fn(),
    };

    seasons = new Seasons(transport, 'pc-na');
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

      transport.get.mockResolvedValue(mockResponse);

      const result = await seasons.getSeasons();

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/seasons');
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

      transport.get.mockResolvedValue(mockResponse);

      const result = await seasons.getCurrentSeason();

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/seasons');
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

      transport.get.mockResolvedValue(mockResponse);

      await expect(seasons.getCurrentSeason()).rejects.toThrow('No current season found');
    });
  });
});
