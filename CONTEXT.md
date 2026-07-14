# PUBG SDK

The PUBG SDK context covers the client-facing concepts used to access PUBG data and understand the client's operational state.

## Language

**Client Health**:
The real operational state of a PUBG client, derived from request outcomes, rate-limit state, cache state, and runtime status. It excludes synthetic PUBG latency and the health of the application hosting the client.
_Avoid_: Process health, simulated API health

**Asset Catalog**:
The synced local collection of PUBG item, vehicle, map, season, and survival-title data distributed with the SDK. It is not a remote asset-fetching facility.
_Avoid_: Network assets, remote asset manager

**Match Telemetry**:
The event stream associated with a PUBG match and discovered through that match's telemetry asset. It belongs to the Matches domain even when its data is fetched from an external URL.
_Avoid_: Standalone telemetry feed
