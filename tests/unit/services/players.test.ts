import type { HttpClient } from '../../../src/api/http-client';
import { PlayersService } from '../../../src/api/services/players';
import type { PlayerSeasonStatsResponse, PlayersResponse } from '../../../src/types';

jest.mock('../../../src/api/http-client');

describe('PlayersService', () => {
  let playersService: PlayersService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      getRateLimitStatus: jest.fn(),
    } as any;

    playersService = new PlayersService(mockHttpClient, 'pc-na');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayers', () => {
    it('should get players by names', async () => {
      const mockResponse: PlayersResponse = {
        data: [
          {
            type: 'player',
            id: 'player-1',
            attributes: {
              createdAt: '2023-01-01T00:00:00Z',
              name: 'TestPlayer',
              patchVersion: '1.0',
              shardId: 'pc-na',
              stats: null,
              titleId: 'pubg',
              updatedAt: '2023-01-01T00:00:00Z',
            },
            relationships: {
              assets: { data: [] },
              matches: { data: [] },
            },
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await playersService.getPlayers({
        playerNames: ['TestPlayer'],
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players?filter%5BplayerNames%5D=TestPlayer'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get players by IDs', async () => {
      const mockResponse: PlayersResponse = {
        data: [
          {
            type: 'player',
            id: 'player-1',
            attributes: {
              createdAt: '2023-01-01T00:00:00Z',
              name: 'TestPlayer',
              patchVersion: '1.0',
              shardId: 'pc-na',
              stats: null,
              titleId: 'pubg',
              updatedAt: '2023-01-01T00:00:00Z',
            },
            relationships: {
              assets: { data: [] },
              matches: { data: [] },
            },
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await playersService.getPlayers({
        playerIds: ['player-1'],
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players?filter%5BplayerIds%5D=player-1'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query', async () => {
      const mockResponse: PlayersResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await playersService.getPlayers({});

      expect(mockHttpClient.get).toHaveBeenCalledWith('/shards/pc-na/players');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPlayerById', () => {
    it('should get player by ID', async () => {
      const mockResponse: PlayersResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await playersService.getPlayerById('player-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players?filter%5BplayerIds%5D=player-1'
      );
    });
  });

  describe('getPlayerByName', () => {
    it('should get player by name', async () => {
      const mockResponse: PlayersResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await playersService.getPlayerByName('TestPlayer');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players?filter%5BplayerNames%5D=TestPlayer'
      );
    });
  });

  describe('getPlayerSeasonStats', () => {
    it('should get player season stats', async () => {
      const mockResponse: PlayerSeasonStatsResponse = {
        data: [
          {
            type: 'playerSeason',
            id: 'player-season-1',
            attributes: {
              bestRankPoint: 1500,
              gameModeStats: {},
            },
            relationships: {
              player: { data: { type: 'player', id: 'player-1' } },
              season: { data: { type: 'season', id: 'season-1' } },
            },
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await playersService.getPlayerSeasonStats({
        playerId: 'player-1',
        seasonId: 'season-1',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players/player-1/seasons/season-1'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get player season stats with game mode filter', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await playersService.getPlayerSeasonStats({
        playerId: 'player-1',
        seasonId: 'season-1',
        gameMode: 'squad',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players/player-1/seasons/season-1?filter[gameMode]=squad'
      );
    });
  });

  describe('getPlayerLifetimeStats', () => {
    it('should get player lifetime stats', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await playersService.getPlayerLifetimeStats('player-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/players/player-1/seasons/lifetime'
      );
    });
  });
});
