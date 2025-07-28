import type { HttpClient } from '../../../src/api/http-client';
import { TelemetryService } from '../../../src/api/services/telemetry';
import type { TelemetryData } from '../../../src/types';

jest.mock('../../../src/api/http-client');

describe('TelemetryService', () => {
  let telemetryService: TelemetryService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      getExternal: jest.fn(),
      getRateLimitStatus: jest.fn(),
    } as any;

    telemetryService = new TelemetryService(mockHttpClient);
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

      mockHttpClient.getExternal.mockResolvedValue(mockResponse);

      const telemetryUrl =
        'https://telemetry-cdn.pubg.com/bluehole-pubg/pc-na/2023/01/01/0/0/match-1-telemetry.json';
      const result = await telemetryService.getTelemetryData(telemetryUrl);

      expect(mockHttpClient.getExternal).toHaveBeenCalledWith(telemetryUrl);
      expect(result).toEqual(mockResponse);
    });
  });
});
