import { Samples } from '../../../src/api/services/samples';
import type { MatchesResponse } from '../../../src/types';
import { createTransportFake, requestedTarget } from './transport-fake';

describe('Samples', () => {
  let samples: Samples;
  let transport: ReturnType<typeof createTransportFake>;

  beforeEach(() => {
    transport = createTransportFake();
    samples = new Samples(transport, 'pc-na');
  });

  describe('getSamples', () => {
    it('should get samples without query parameters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await samples.getSamples();

      expect(requestedTarget(transport)).toEqual({
        segments: ['shards', 'pc-na', 'samples'],
        query: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get samples with date filters', async () => {
      transport.get.mockResolvedValue({ data: [] });

      await samples.getSamples({
        createdAt: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-31T23:59:59Z',
        },
      });

      expect(requestedTarget(transport).query).toEqual({
        'filter[createdAt-start]': '2023-01-01T00:00:00Z',
        'filter[createdAt-end]': '2023-01-31T23:59:59Z',
      });
    });
  });
});
