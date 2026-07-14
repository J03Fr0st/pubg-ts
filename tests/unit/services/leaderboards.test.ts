import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { Leaderboards } from '../../../src/api/services/leaderboards';
import type { LeaderboardResponse } from '../../../src/types';

describe('Leaderboards', () => {
  let leaderboards: Leaderboards;
  let transport: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    transport = {
      get: jest.fn(),
      fetchTelemetry: jest.fn(),
    };

    leaderboards = new Leaderboards(transport, 'pc-na');
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

      transport.get.mockResolvedValue(mockResponse);

      const result = await leaderboards.getLeaderboard({
        seasonId: 'season-1',
        gameMode: 'squad',
      });

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/leaderboards/season-1/squad');
      expect(result).toEqual(mockResponse);
    });

    it('should get leaderboard with pagination', async () => {
      const mockResponse: LeaderboardResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await leaderboards.getLeaderboard({
        seasonId: 'season-1',
        gameMode: 'squad',
        pageSize: 10,
        offset: 20,
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/leaderboards/season-1/squad?page%5Blimit%5D=10&page%5Boffset%5D=20'
      );
    });
  });
});
