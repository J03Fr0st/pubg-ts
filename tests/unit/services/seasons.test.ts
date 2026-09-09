import { Seasons } from '../../../src/api/services/seasons';
import { PubgNotFoundError } from '../../../src/errors';
import type { SeasonsResponse } from '../../../src/types';
import { createTransportFake, requestedTarget } from './transport-fake';

const season = (id: string, isCurrentSeason: boolean): SeasonsResponse['data'][number] => ({
  type: 'season',
  id,
  attributes: { isCurrentSeason, isOffseason: false },
  relationships: {},
});

describe('Seasons', () => {
  let seasons: Seasons;
  let transport: ReturnType<typeof createTransportFake>;

  beforeEach(() => {
    transport = createTransportFake();
    seasons = new Seasons(transport, 'pc-na');
  });

  describe('getSeasons', () => {
    it('should get all seasons', async () => {
      const mockResponse: SeasonsResponse = {
        data: [season('season-1', false), season('season-2', true)],
      };
      transport.get.mockResolvedValue(mockResponse);

      const result = await seasons.getSeasons();

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'seasons'],
        query: {},
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentSeason', () => {
    it('should return only the season PUBG flags as current', async () => {
      transport.get.mockResolvedValue({
        data: [season('season-1', false), season('season-2', true)],
      });

      const result = await seasons.getCurrentSeason();

      expect(requestedTarget(transport).segments).toEqual(['shards', 'pc-na', 'seasons']);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].attributes.isCurrentSeason).toBe(true);
    });

    it('should reject with a typed not-found error when PUBG reports no current season', async () => {
      transport.get.mockResolvedValue({ data: [season('season-1', false)] });

      const error = await seasons.getCurrentSeason().catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(PubgNotFoundError);
      expect((error as PubgNotFoundError).message).toBe('No current season found');
      expect((error as PubgNotFoundError).context.metadata).toMatchObject({ shard: 'pc-na' });
    });
  });
});
