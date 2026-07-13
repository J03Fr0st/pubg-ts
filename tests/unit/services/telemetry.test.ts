import type { EndpointTransport } from '../../../src/api/endpoint-transport';
import { TelemetryService } from '../../../src/api/services/telemetry';
import type { TelemetryData } from '../../../src/types';

describe('TelemetryService', () => {
  let telemetryService: TelemetryService;
  let transport: jest.Mocked<EndpointTransport>;

  beforeEach(() => {
    transport = {
      get: jest.fn(),
      fetchTelemetry: jest.fn(),
    };

    telemetryService = new TelemetryService(transport);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTelemetryData', () => {
    it('should get telemetry data from URL', async () => {
      const mockResponse: TelemetryData = [
        {
          _D: '2023-01-01T00:00:00.000Z',
          _T: 'LogMatchStart',
          common: {
            matchId: 'match-1',
            mapName: 'Erangel_Main',
            isGame: 1,
          },
        },
      ];

      transport.fetchTelemetry.mockResolvedValue(mockResponse);

      const telemetryUrl =
        'https://telemetry-cdn.pubg.com/bluehole-pubg/pc-na/2023/01/01/0/0/match-1-telemetry.json';
      const result = await telemetryService.getTelemetryData(telemetryUrl);

      expect(transport.fetchTelemetry).toHaveBeenCalledWith(telemetryUrl);
      expect(result).toEqual(mockResponse);
    });
  });
});
