import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { PlayersService } from '../../../src/api/services/players';
import type { PlayerSeasonStatsResponse, PlayersResponse } from '../../../src/types';

describe('PlayersService', () => {
  let playersService: PlayersService;
  let mockHttpClient: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      fetchTelemetry: jest.fn(),
    };

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

  describe('getPlayerSeasonStatsBatch', () => {
    it('should get season stats for a batch of players', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await playersService.getPlayerSeasonStatsBatch({
        seasonId: 'season-1',
        gameMode: 'squad-fpp',
        playerIds: ['player-1', 'player-2'],
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/seasons/season-1/gameMode/squad-fpp/players?filter%5BplayerIds%5D=player-1%2Cplayer-2'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should reject empty player ID batches', async () => {
      await expect(
        playersService.getPlayerSeasonStatsBatch({
          seasonId: 'season-1',
          gameMode: 'squad-fpp',
          playerIds: [],
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should reject player ID batches larger than 10', async () => {
      await expect(
        playersService.getPlayerSeasonStatsBatch({
          seasonId: 'season-1',
          gameMode: 'squad-fpp',
          playerIds: Array.from({ length: 11 }, (_, index) => `player-${index + 1}`),
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
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

  describe('getPlayerLifetimeStatsBatch', () => {
    it('should get lifetime stats for a batch of players', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await playersService.getPlayerLifetimeStatsBatch({
        gameMode: 'squad-fpp',
        playerIds: ['player-1', 'player-2'],
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/shards/pc-na/seasons/lifetime/gameMode/squad-fpp/players?filter%5BplayerIds%5D=player-1%2Cplayer-2'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should reject empty player ID batches', async () => {
      await expect(
        playersService.getPlayerLifetimeStatsBatch({
          gameMode: 'squad-fpp',
          playerIds: [],
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should reject player ID batches larger than 10', async () => {
      await expect(
        playersService.getPlayerLifetimeStatsBatch({
          gameMode: 'squad-fpp',
          playerIds: Array.from({ length: 11 }, (_, index) => `player-${index + 1}`),
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });
});
