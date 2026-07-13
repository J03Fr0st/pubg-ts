import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { Matches } from '../../../src/api/services/matches';
import type { MatchesResponse, MatchResponse } from '../../../src/types';

describe('Matches', () => {
  let matches: Matches;
  let transport: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    transport = {
      get: jest.fn(),
      fetchTelemetry: jest.fn(),
    };

    matches = new Matches(transport, 'pc-na');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMatch', () => {
    it('should get match by ID', async () => {
      const mockResponse: MatchResponse = {
        data: {
          type: 'match',
          id: 'match-1',
          attributes: {
            createdAt: '2023-01-01T00:00:00Z',
            duration: 1800,
            gameMode: 'squad',
            mapName: 'Erangel_Main',
            isCustomMatch: false,
            patchVersion: '1.0',
            seasonState: 'prepare',
            shardId: 'pc-na',
            stats: null,
            tags: null,
            titleId: 'pubg',
            matchType: 'official',
          },
          relationships: {
            assets: { data: [] },
            rosters: { data: [] },
            rounds: { data: [] },
          },
        },
        included: [],
      };

      transport.get.mockResolvedValue(mockResponse);

      const result = await matches.getMatch('match-1');

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/matches/match-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMatches', () => {
    it('should get matches without query parameters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await matches.getMatches();

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/matches');
      expect(result).toEqual(mockResponse);
    });

    it('should get matches with pagination', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await matches.getMatches({
        pageSize: 10,
        offset: 20,
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/matches?page%5Blimit%5D=10&page%5Boffset%5D=20'
      );
    });

    it('should get matches with sort parameter', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await matches.getMatches({
        sort: '-createdAt',
      });

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/matches?sort=-createdAt');
    });

    it('should get matches with filters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await matches.getMatches({
        filter: {
          createdAt: {
            start: '2023-01-01T00:00:00Z',
            end: '2023-01-31T23:59:59Z',
          },
          playerIds: ['player-1', 'player-2'],
          gameMode: ['squad', 'duo'],
        },
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/matches?filter%5BcreatedAt-start%5D=2023-01-01T00%3A00%3A00Z&filter%5BcreatedAt-end%5D=2023-01-31T23%3A59%3A59Z&filter%5BplayerIds%5D=player-1%2Cplayer-2&filter%5BgameMode%5D=squad%2Cduo'
      );
    });
  });
});
