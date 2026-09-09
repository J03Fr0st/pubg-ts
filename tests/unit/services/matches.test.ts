import { Matches } from '../../../src/api/services/matches';
import { PubgNotFoundError, PubgValidationError } from '../../../src/errors';
import type { Asset, MatchesResponse, MatchResponse, TelemetryData } from '../../../src/types';
import { createMatchTransportFake, requestedTarget } from './transport-fake';

const createMatchResponse = (included: MatchResponse['included'] = []): MatchResponse => ({
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
  included,
});

const createTelemetryAsset = (id: string, URL: string): Asset => ({
  type: 'asset',
  id,
  attributes: {
    name: 'telemetry',
    URL,
    createdAt: '2026-07-13T15:00:00.000Z',
    description: '',
  },
  relationships: {},
});

describe('Matches', () => {
  let matches: Matches;
  let transport: ReturnType<typeof createMatchTransportFake>;

  beforeEach(() => {
    transport = createMatchTransportFake();
    matches = new Matches(transport, 'pc-na');
  });

  describe('getMatch', () => {
    it('should get match by ID', async () => {
      const mockResponse = createMatchResponse();

      transport.get.mockResolvedValue(mockResponse);

      const result = await matches.getMatch('match-1');

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'matches', 'match-1'],
        query: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('keeps reserved characters in match IDs within one path segment', async () => {
      transport.get.mockResolvedValue(createMatchResponse());

      await matches.getMatch('match/one?source=test');

      expect(requestedTarget(transport).segments).toEqual([
        'shards',
        'pc-na',
        'matches',
        'match/one?source=test',
      ]);
    });
  });

  describe('getTelemetry', () => {
    it('gets telemetry from the match telemetry asset URL only', async () => {
      const telemetryUrl = 'https://telemetry.test/match-1';
      const telemetry = [
        {
          _D: '2026-07-13T15:00:00.000Z',
          _T: 'LogMatchStart',
          common: { isGame: 1, mapName: 'Erangel_Main', matchId: 'match-1' },
        },
      ] as TelemetryData;
      transport.get.mockResolvedValue(
        createMatchResponse([createTelemetryAsset('asset-1', telemetryUrl)])
      );
      transport.fetchTelemetry.mockResolvedValue(telemetry);

      await expect(matches.getTelemetry('match-1')).resolves.toEqual(telemetry);

      expect(requestedTarget(transport).segments).toEqual([
        'shards',
        'pc-na',
        'matches',
        'match-1',
      ]);
      expect(transport.fetchTelemetry).toHaveBeenCalledTimes(1);
      expect(transport.fetchTelemetry.mock.calls[0]).toEqual([telemetryUrl]);
    });

    it('rejects a match with no telemetry asset', async () => {
      transport.get.mockResolvedValue(createMatchResponse());

      await expect(matches.getTelemetry('match-1')).rejects.toThrow(PubgNotFoundError);
      expect(transport.fetchTelemetry).not.toHaveBeenCalled();
    });

    it('rejects a match with multiple telemetry assets', async () => {
      transport.get.mockResolvedValue(
        createMatchResponse([
          createTelemetryAsset('asset-1', 'https://telemetry.test/match-1-a'),
          createTelemetryAsset('asset-2', 'https://telemetry.test/match-1-b'),
        ])
      );

      await expect(matches.getTelemetry('match-1')).rejects.toThrow(PubgValidationError);
      expect(transport.fetchTelemetry).not.toHaveBeenCalled();
    });

    it('rejects a malformed telemetry asset URL', async () => {
      transport.get.mockResolvedValue(
        createMatchResponse([createTelemetryAsset('asset-1', 'https://')])
      );

      await expect(matches.getTelemetry('match-1')).rejects.toThrow(PubgValidationError);
      expect(transport.fetchTelemetry).not.toHaveBeenCalled();
    });

    it('rejects a telemetry asset with a malformed shape', async () => {
      const malformedAsset = createTelemetryAsset('asset-1', 'https://telemetry.test/match-1');
      Reflect.deleteProperty(malformedAsset.attributes, 'URL');
      transport.get.mockResolvedValue(createMatchResponse([malformedAsset]));

      await expect(matches.getTelemetry('match-1')).rejects.toThrow(PubgValidationError);
      expect(transport.fetchTelemetry).not.toHaveBeenCalled();
    });

    it('rejects and redacts a non-HTTPS telemetry asset URL', async () => {
      const telemetryUrl = 'http://telemetry.test/match-1?credential=secret';
      transport.get.mockResolvedValue(
        createMatchResponse([createTelemetryAsset('asset-1', telemetryUrl)])
      );

      const error = await matches.getTelemetry('match-1').catch((cause: unknown) => cause);

      expect(error).toBeInstanceOf(PubgValidationError);
      expect(JSON.stringify((error as PubgValidationError).getDetails())).not.toContain(
        telemetryUrl
      );
      expect(transport.fetchTelemetry).not.toHaveBeenCalled();
    });
  });

  describe('getMatches', () => {
    it('should get matches without query parameters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await matches.getMatches();

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'matches'],
        query: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get matches with pagination', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await matches.getMatches({
        pageSize: 10,
        offset: 20,
      });

      expect(requestedTarget(transport).query).toEqual({
        'page[limit]': '10',
        'page[offset]': '20',
      });
    });

    it('should get matches with sort parameter', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await matches.getMatches({
        sort: '-createdAt',
      });

      expect(requestedTarget(transport).query).toEqual({ sort: '-createdAt' });
    });

    it('should get matches with filters', async () => {
      transport.get.mockResolvedValue({ data: [] });

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

      expect(requestedTarget(transport).query).toEqual({
        'filter[createdAt-start]': '2023-01-01T00:00:00Z',
        'filter[createdAt-end]': '2023-01-31T23:59:59Z',
        'filter[playerIds]': 'player-1,player-2',
        'filter[gameMode]': 'squad,duo',
      });
    });
  });
});
