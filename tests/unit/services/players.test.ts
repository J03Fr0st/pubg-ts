import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { Players } from '../../../src/api/services/players';
import type { PlayerSeasonStatsResponse, PlayersResponse } from '../../../src/types';

describe('Players', () => {
  let players: Players;
  let transport: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    transport = {
      get: jest.fn(),
    };

    players = new Players(transport, 'pc-na');
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

      transport.get.mockResolvedValue(mockResponse);

      const result = await players.getPlayers({
        playerNames: ['TestPlayer'],
      });

      expect(transport.get).toHaveBeenCalledWith(
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

      transport.get.mockResolvedValue(mockResponse);

      const result = await players.getPlayers({
        playerIds: ['player-1'],
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/players?filter%5BplayerIds%5D=player-1'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query', async () => {
      const mockResponse: PlayersResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await players.getPlayers({});

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/players');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPlayerById', () => {
    it('should get player by ID', async () => {
      const mockResponse: PlayersResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await players.getPlayerById('player-1');

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/players?filter%5BplayerIds%5D=player-1'
      );
    });
  });

  describe('getPlayerByName', () => {
    it('should get player by name', async () => {
      const mockResponse: PlayersResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await players.getPlayerByName('TestPlayer');

      expect(transport.get).toHaveBeenCalledWith(
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

      transport.get.mockResolvedValue(mockResponse);

      const result = await players.getPlayerSeasonStats({
        playerId: 'player-1',
        seasonId: 'season-1',
      });

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/players/player-1/seasons/season-1');
      expect(result).toEqual(mockResponse);
    });

    it('should get player season stats with game mode filter', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await players.getPlayerSeasonStats({
        playerId: 'player-1',
        seasonId: 'season-1',
        gameMode: 'squad',
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/players/player-1/seasons/season-1?filter%5BgameMode%5D=squad'
      );
    });
  });

  describe('getPlayerSeasonStatsBatch', () => {
    it('should get season stats for a batch of players', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await players.getPlayerSeasonStatsBatch({
        seasonId: 'season-1',
        gameMode: 'squad-fpp',
        playerIds: ['player-1', 'player-2'],
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/seasons/season-1/gameMode/squad-fpp/players?filter%5BplayerIds%5D=player-1%2Cplayer-2'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should reject empty player ID batches', async () => {
      await expect(
        players.getPlayerSeasonStatsBatch({
          seasonId: 'season-1',
          gameMode: 'squad-fpp',
          playerIds: [],
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(transport.get).not.toHaveBeenCalled();
    });

    it('should reject player ID batches larger than 10', async () => {
      await expect(
        players.getPlayerSeasonStatsBatch({
          seasonId: 'season-1',
          gameMode: 'squad-fpp',
          playerIds: Array.from({ length: 11 }, (_, index) => `player-${index + 1}`),
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(transport.get).not.toHaveBeenCalled();
    });
  });

  describe('getPlayerLifetimeStats', () => {
    it('should get player lifetime stats', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await players.getPlayerLifetimeStats('player-1');

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/players/player-1/seasons/lifetime');
    });
  });

  describe('getPlayerLifetimeStatsBatch', () => {
    it('should get lifetime stats for a batch of players', async () => {
      const mockResponse: PlayerSeasonStatsResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await players.getPlayerLifetimeStatsBatch({
        gameMode: 'squad-fpp',
        playerIds: ['player-1', 'player-2'],
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/seasons/lifetime/gameMode/squad-fpp/players?filter%5BplayerIds%5D=player-1%2Cplayer-2'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should reject empty player ID batches', async () => {
      await expect(
        players.getPlayerLifetimeStatsBatch({
          gameMode: 'squad-fpp',
          playerIds: [],
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(transport.get).not.toHaveBeenCalled();
    });

    it('should reject player ID batches larger than 10', async () => {
      await expect(
        players.getPlayerLifetimeStatsBatch({
          gameMode: 'squad-fpp',
          playerIds: Array.from({ length: 11 }, (_, index) => `player-${index + 1}`),
        })
      ).rejects.toThrow('playerIds must contain between 1 and 10 player IDs');

      expect(transport.get).not.toHaveBeenCalled();
    });
  });
});
