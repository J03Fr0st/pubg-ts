import { Leaderboards } from '../../../src/api/services/leaderboards';
import type { LeaderboardResponse } from '../../../src/types';
import { createTransportFake, requestedTarget } from './transport-fake';

describe('Leaderboards', () => {
  let leaderboards: Leaderboards;
  let transport: ReturnType<typeof createTransportFake>;

  beforeEach(() => {
    transport = createTransportFake();
    leaderboards = new Leaderboards(transport, 'pc-na');
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

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'leaderboards', 'season-1', 'squad'],
        query: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get leaderboard with pagination', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await leaderboards.getLeaderboard({
        seasonId: 'season-1',
        gameMode: 'squad',
        pageSize: 10,
        offset: 20,
      });

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'leaderboards', 'season-1', 'squad'],
        query: { 'page[limit]': '10', 'page[offset]': '20' },
      });
    });
  });
});
