---
"@j03fr0st/pubg-ts": major
---

Delete the dead surface and deepen the request runtime.

- Remove `SecurityManager` and the duplicate telemetry sample types (~1,100 lines with no importers), the unused `post`/`put`/`delete` transaction methods, `MemoryCache.warm()`, `PubgClientOptions`, and the package-root dictionary constants (`ITEM_DICTIONARY`, `VEHICLE_DICTIONARY`, `MAP_DICTIONARY`, `MAP_NAMES`, `GAME_MODE_DICTIONARY`, `GAME_MODES`, `DAMAGE_CAUSER_DICTIONARY`, `DAMAGE_CAUSER_NAME`, `SEASONS_DATA`). `debug` is now a runtime dependency; `validator` is dropped.
- Rename `AssetCatalog.getCurrentSeason()` to `getActiveSeason()` so the bundled Season Activity lookup cannot be confused with `client.seasons.getCurrentSeason()`.
- `Seasons.getCurrentSeason()` rejects with `PubgNotFoundError` and the `Players` batch methods reject with `PubgValidationError` instead of plain `Error`/`RangeError`.
- Generate `src/types/assets/` from the bundled JSON (`npm run generate:asset-types`) so the catalog data has one source of truth.
- Consolidate the request runtime under `src/api/runtime/` with defaults resolved once at construction, and carry a branded `EndpointTarget` across the internal transport seam.

See MIGRATION.md for the v2 to v3 mapping.
