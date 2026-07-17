# PUBG SDK

The PUBG SDK context covers the client-facing concepts used to access PUBG data and understand the client's operational state.

## Language

**Client Health**:
The real operational state of a PUBG client, derived from request outcomes, rate-limit state, cache state, and runtime status. It excludes synthetic PUBG latency and the health of the application hosting the client.
_Avoid_: Process health, simulated API health

**Asset Catalog**:
The bundled local collection of PUBG item, vehicle, map, season, and survival-title data distributed with the SDK. It is not a remote asset-fetching or synchronization facility.
_Avoid_: Network assets, remote asset manager

**Match Telemetry**:
The event stream associated with a PUBG match and discovered through that match's telemetry asset. It belongs to the Matches domain even when its data is fetched from an external URL.
_Avoid_: Standalone telemetry feed

**Endpoint Target**:
The shard-scoped path and query that identify PUBG data for a client request. Identifiers remain single path segments even when they contain reserved URL characters.
_Avoid_: Raw endpoint string, unencoded path

**Request Outcome**:
The semantic result of a client request used by Client Health, independent of the network adapter or error representation that produced it.
_Avoid_: HTTP error object, Axios failure

**Season Activity**:
Whether an Asset Catalog season is active at the time it is read, based on its bundled start and end dates. It is time-dependent state, not permanently normalized catalog data.
_Avoid_: Cached season status
