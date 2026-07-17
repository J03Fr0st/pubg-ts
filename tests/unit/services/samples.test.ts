import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { Samples } from '../../../src/api/services/samples';
import type { MatchesResponse } from '../../../src/types';

describe('Samples', () => {
  let samples: Samples;
  let transport: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    transport = {
      get: jest.fn(),
    };

    samples = new Samples(transport, 'pc-na');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSamples', () => {
    it('should get samples without query parameters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      const result = await samples.getSamples();

      expect(transport.get).toHaveBeenCalledWith('/shards/pc-na/samples');
      expect(result).toEqual(mockResponse);
    });

    it('should get samples with date filters', async () => {
      const mockResponse: MatchesResponse = { data: [] };
      transport.get.mockResolvedValue(mockResponse);

      await samples.getSamples({
        createdAt: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-31T23:59:59Z',
        },
      });

      expect(transport.get).toHaveBeenCalledWith(
        '/shards/pc-na/samples?filter%5BcreatedAt-start%5D=2023-01-01T00%3A00%3A00Z&filter%5BcreatedAt-end%5D=2023-01-31T23%3A59%3A59Z'
      );
    });
  });
});
