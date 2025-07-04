import type { HttpClient } from '../../../src/api/http-client';
import { LeaderboardsService } from '../../../src/api/services/leaderboards';
import type { LeaderboardResponse } from '../../../src/types';

jest.mock('../../../src/api/http-client');

describe('LeaderboardsService', () => {
  let leaderboardsService: LeaderboardsService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      getRateLimitStatus: jest.fn(),
    } as any;

    leaderboardsService = new LeaderboardsService(mockHttpClient, 'pc-na');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLeaderboard', () => {
    it('should get leaderboard', async () => {
      const mockResponse: LeaderboardResponse = {
        data: [
          {
            type: 'leaderboard',
            id: 'leaderboard-1',
            attributes: {
              shardId: 'pc-na',
              gameMode: 'squad',
              rankedStats: [],
            },
            relationships: {
              players: { data: [] },
            },
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await leaderboardsService.getLeaderboard({
        seasonId: 'season-1',
        gameMode: 'squad',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/shards/pc-na/leaderboards/season-1/squad');
      expect(result).toEqual(mockResponse);
    });

    it('should get leaderboard with pagination', async () => {
      const mockResponse: LeaderboardResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await leaderboardsService.getLeaderboard({
        seasonId: 'season-1',
        gameMode: 'squad',
        pageSize: 10,
        offset: 20,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/leaderboards/season-1/squad?page%5Blimit%5D=10&page%5Boffset%5D=20'
      );
    });
  });
});
