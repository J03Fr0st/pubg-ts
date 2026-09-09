# Task List

## 2026-06-09

- [x] Create approved architecture deepening design covering runtime observability, HTTP transaction mechanics, asset catalog, and endpoint query construction.
- [x] Create architecture deepening feature specification from the approved design.

## 2026-06-14

- [x] Add batch season and lifetime stats wrappers to `PlayersService`.

## 2026-07-17

- [x] Deepen endpoint targets, request failure interpretation, Match Telemetry capability locality, and time-dependent Asset Catalog state.

## 2026-09-09

- [x] Address review follow-ups: narrow error-contract documentation, extract runtime test fixtures below the 500-line limit, and lock removed dictionary types out of the public interface. Verified build, all 201 tests, and Biome on the affected TypeScript files.

- [x] Apply the architecture review: delete the dead surface (`security.ts`, telemetry sample types, unused transaction methods and exports) and correct the dependency seam; unify the error vocabulary and rename `AssetCatalog.getActiveSeason`; generate `src/types/assets/` from the bundled JSON; consolidate the Request Runtime under `src/api/runtime/` with one test harness; carry a branded `EndpointTarget` across the transport seam.
