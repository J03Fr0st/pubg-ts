# @j03fr0st/pubg-ts

## 3.0.0

### Major Changes

- ebb449e: Delete the dead surface and deepen the request runtime.

  - Remove `SecurityManager` and the duplicate telemetry sample types (~1,100 lines with no importers), the unused `post`/`put`/`delete` transaction methods, `MemoryCache.warm()`, `PubgClientOptions`, and the package-root dictionary constants (`ITEM_DICTIONARY`, `VEHICLE_DICTIONARY`, `MAP_DICTIONARY`, `MAP_NAMES`, `GAME_MODE_DICTIONARY`, `GAME_MODES`, `DAMAGE_CAUSER_DICTIONARY`, `DAMAGE_CAUSER_NAME`, `SEASONS_DATA`). `debug` is now a runtime dependency; `validator` is dropped.
  - Rename `AssetCatalog.getCurrentSeason()` to `getActiveSeason()` so the bundled Season Activity lookup cannot be confused with `client.seasons.getCurrentSeason()`.
  - `Seasons.getCurrentSeason()` rejects with `PubgNotFoundError` and the `Players` batch methods reject with `PubgValidationError` instead of plain `Error`/`RangeError`.
  - Generate `src/types/assets/` from the bundled JSON (`npm run generate:asset-types`) so the catalog data has one source of truth.
  - Consolidate the request runtime under `src/api/runtime/` with defaults resolved once at construction, and carry a branded `EndpointTarget` across the internal transport seam.

  See MIGRATION.md for the v2 to v3 mapping.

  Protect catalog metadata with caller-owned copies and reject inherited dictionary properties.
  Return coherent rate-limit snapshots, distinguish adapter timeouts from connection failures, and
  reject dot-only Endpoint Target segments. Add a non-writing generated-type check to CI.

  Require Axios 1.20.0 or newer within v1 and refresh vulnerable transitive dependencies.

## 2.0.1

### Patch Changes

- Deepen endpoint target construction, request failure handling, Match Telemetry isolation, and time-dependent Asset Catalog season state.

## 2.0.0

### Major Changes

- dd4eea5: Replace shared runtime state and shallow compatibility facades with client-local request state, synchronous Client Health, domain-named endpoint modules, Match Telemetry under Matches, and one local-only Asset Catalog. See MIGRATION.md for breaking changes.

## 1.1.0

### Minor Changes

- 3077eac: Add batch player season and lifetime stats methods for up to 10 player IDs.

## 1.0.10

### Patch Changes

- 414f270: chore: update dependencies to latest versions

## 1.0.9

### Patch Changes

- 1c973cf: Add in changeset
