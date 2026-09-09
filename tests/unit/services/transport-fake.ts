import { describeEndpointTarget, type EndpointTargetParts } from '../../../src/api/endpoint-query';
import type { EndpointTransport, MatchTransport } from '../../../src/api/endpoint-transport';

/** Fake for the transport seam every endpoint module depends on. */
export const createTransportFake = (): jest.Mocked<EndpointTransport> => ({
  get: jest.fn(),
});

/** Fake for the wider seam only Matches sees. */
export const createMatchTransportFake = (): jest.Mocked<MatchTransport> => ({
  get: jest.fn(),
  fetchTelemetry: jest.fn(),
});

/** Decodes the Endpoint Target passed to the n-th `get` call, so tests assert meaning, not bytes. */
export const requestedTarget = (
  transport: jest.Mocked<EndpointTransport>,
  call = 0
): EndpointTargetParts => describeEndpointTarget(transport.get.mock.calls[call][0]);
