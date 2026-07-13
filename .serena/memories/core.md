# Core

- TypeScript SDK package for PUBG API; public entrypoint is `src/index.ts`, emitted to `dist/index.js` and `dist/index.d.ts`.
- `src/api/client.ts` exposes `PubgClient`; each instance owns one internal `ClientRuntime`, public `players`, `matches`, `seasons`, `leaderboards`, `samples`, and local-only `AssetCatalog` members, plus synchronous `getHealth()` and `clearResponseCache()` methods. Match telemetry is fetched through `matches.getTelemetry()`.
- API service files live in `src/api/services/`; each service builds PUBG endpoint URLs for one API domain and delegates requests through the endpoint transport.
- `src/api/client-runtime.ts` is the client-local composition root for response caching, rate limiting, request deduplication, HTTP transactions, external telemetry fetches, and synchronous redacted health snapshots.
- `src/types/` contains hand-maintained API response/query types plus generated/static asset types under `src/types/assets/`.
- `src/assets/` contains bundled JSON dictionaries/enums used by `AssetCatalog` for synchronous local lookups.
- `src/utils/assets/catalog.ts` owns `AssetCatalog`; `assetBaseUrl` affects generated image URLs only, derived caches are private, and there is no facade singleton or remote syncing. Other `src/utils/` infrastructure includes `MemoryCache`, `RateLimiter`, logger/timing, security validation, and request deduplication.
- Tests mirror source responsibilities in `tests/unit/`, with service tests using mocked endpoint transports and infrastructure tests for client runtime/health, HTTP transactions, cache, rate limiter, errors, and assets. Integration tests exist in `tests/integration/` and may touch real PUBG API scenarios.
- Planning artifacts currently live under `docs/design/2026-06-09-architecture-deepening/` and `docs/specs/2026-06-09-architecture-deepening/`; read them before architecture-deepening work.
- Current root has no `PLANNING.md`. `TASK.md` exists and tracks dated completed planning/spec tasks.
- Related memories: read `mem:tech_stack` for tool versions/scripts, `mem:conventions` for project-specific style and patterns, `mem:suggested_commands` for Windows command usage, `mem:task_completion` for done checks.
