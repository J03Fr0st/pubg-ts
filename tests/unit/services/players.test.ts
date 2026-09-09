import { Players } from '../../../src/api/services/players';
import { PubgValidationError } from '../../../src/errors';
import type { PlayerSeasonStatsResponse, PlayersResponse } from '../../../src/types';
import { createTransportFake, requestedTarget } from './transport-fake';

const playersResponse: PlayersResponse = {
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

const seasonStatsResponse: PlayerSeasonStatsResponse = {
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

const elevenPlayerIds = Array.from({ length: 11 }, (_, index) => `player-${index + 1}`);

describe('Players', () => {
  let players: Players;
  let transport: ReturnType<typeof createTransportFake>;

  beforeEach(() => {
    transport = createTransportFake();
    players = new Players(transport, 'pc-na');
  });

  describe('getPlayers', () => {
    it('should get players by names', async () => {
      transport.get.mockResolvedValue(playersResponse);

      const result = await players.getPlayers({ playerNames: ['TestPlayer'] });

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'players'],
        query: { 'filter[playerNames]': 'TestPlayer' },
      });
      expect(result).toEqual(playersResponse);
    });

    it('should get players by IDs', async () => {
      transport.get.mockResolvedValue(playersResponse);

      const result = await players.getPlayers({ playerIds: ['player-1'] });

      expect(requestedTarget(transport).query).toEqual({ 'filter[playerIds]': 'player-1' });
      expect(result).toEqual(playersResponse);
    });

    it('should handle empty query', async () => {
      transport.get.mockResolvedValue({ data: [] });

      const result = await players.getPlayers({});

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'players'],
        query: {},
      });
      expect(result).toEqual({ data: [] });
    });
  });

  describe('getPlayerById', () => {
    it('should get player by ID', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await players.getPlayerById('player-1');

      expect(requestedTarget(transport).query).toEqual({ 'filter[playerIds]': 'player-1' });
    });
  });

  describe('getPlayerByName', () => {
    it('should get player by name', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await players.getPlayerByName('TestPlayer');

      expect(requestedTarget(transport).query).toEqual({ 'filter[playerNames]': 'TestPlayer' });
    });
  });

  describe('getPlayerSeasonStats', () => {
    it('should get player season stats', async () => {
      transport.get.mockResolvedValue(seasonStatsResponse);

      const result = await players.getPlayerSeasonStats({
        playerId: 'player-1',
        seasonId: 'season-1',
      });

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'players', 'player-1', 'seasons', 'season-1'],
        query: {},
      });
      expect(result).toEqual(seasonStatsResponse);
    });

    it('should get player season stats with game mode filter', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await players.getPlayerSeasonStats({
        playerId: 'player-1',
        seasonId: 'season-1',
        gameMode: 'squad',
      });

      expect(requestedTarget(transport).query).toEqual({ 'filter[gameMode]': 'squad' });
    });
  });

  describe('getPlayerSeasonStatsBatch', () => {
    it('should get season stats for a batch of players', async () => {
      transport.get.mockResolvedValue({ data: [] });

      const result = await players.getPlayerSeasonStatsBatch({
        seasonId: 'season-1',
        gameMode: 'squad-fpp',
        playerIds: ['player-1', 'player-2'],
      });

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'seasons', 'season-1', 'gameMode', 'squad-fpp', 'players'],
        query: { 'filter[playerIds]': 'player-1,player-2' },
      });
      expect(result).toEqual({ data: [] });
    });

    it.each([
      ['empty', []],
      ['larger than 10', elevenPlayerIds],
    ])('should reject %s player ID batches with a validation error', async (_label, playerIds) => {
      const error = await players
        .getPlayerSeasonStatsBatch({ seasonId: 'season-1', gameMode: 'squad-fpp', playerIds })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(PubgValidationError);
      expect((error as PubgValidationError).message).toBe(
        'playerIds must contain between 1 and 10 player IDs'
      );
      expect(transport.get).not.toHaveBeenCalled();
    });
  });

  describe('getPlayerLifetimeStats', () => {
    it('should get player lifetime stats', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await players.getPlayerLifetimeStats('player-1');

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'players', 'player-1', 'seasons', 'lifetime'],
        query: {},
      });
    });
  });

  describe('getPlayerLifetimeStatsBatch', () => {
    it('should get lifetime stats for a batch of players', async () => {
      transport.get.mockResolvedValue({ data: [] });

      const result = await players.getPlayerLifetimeStatsBatch({
        gameMode: 'squad-fpp',
        playerIds: ['player-1', 'player-2'],
      });

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'seasons', 'lifetime', 'gameMode', 'squad-fpp', 'players'],
        query: { 'filter[playerIds]': 'player-1,player-2' },
      });
      expect(result).toEqual({ data: [] });
    });

    it.each([
      ['empty', []],
      ['larger than 10', elevenPlayerIds],
    ])('should reject %s player ID batches with a validation error', async (_label, playerIds) => {
      await expect(
        players.getPlayerLifetimeStatsBatch({ gameMode: 'squad-fpp', playerIds })
      ).rejects.toBeInstanceOf(PubgValidationError);

      expect(transport.get).not.toHaveBeenCalled();
    });
  });
});
