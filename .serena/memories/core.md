# Core

- TypeScript SDK package for PUBG API; public entrypoint is `src/index.ts`, emitted to `dist/index.js` and `dist/index.d.ts`.
- `src/api/client.ts` exposes `PubgClient`; constructor wires one shared `HttpClient` plus service instances: players, matches, seasons, leaderboards, samples, telemetry, assets.
- API service files live in `src/api/services/`; each service builds PUBG endpoint URLs for one API domain and delegates HTTP to shared `HttpClient`.
- `src/api/http-client.ts` is the cross-cutting HTTP layer: axios instance, API auth headers, rate limiter, global cache, retry/error mapping, monitoring hooks, external telemetry URL fetches.
- `src/types/` contains hand-maintained API response/query types plus generated/static asset types under `src/types/assets/`.
- `src/assets/` contains local JSON dictionaries/enums used by `AssetManager` for zero-network lookups.
- `src/utils/` contains shared infrastructure: `AssetManager`, `MemoryCache`, `RateLimiter`, logger/timing, security validation, monitoring, health checks, request deduplication.
- Node/browser split exists for observability utilities: `monitoring.ts` and `health-check.ts` are browser-compatible; `*-node.ts` files exist but are excluded from `tsconfig.json` build. Package `browser` field remaps `dist/utils/monitoring.js` and `dist/utils/health-check.js` to browser filenames that may not exist in the current source tree; verify before changing package exports.
- Tests mirror source responsibilities in `tests/unit/`, with service tests using mocked HTTP clients and infrastructure tests for cache/rate limiter/errors/assets/observability. Integration tests exist in `tests/integration/` and may touch real PUBG API scenarios.
- Planning artifacts currently live under `docs/design/2026-06-09-architecture-deepening/` and `docs/specs/2026-06-09-architecture-deepening/`; read them before architecture-deepening work.
- Current root has no `PLANNING.md`. `TASK.md` exists and tracks dated completed planning/spec tasks.
- Related memories: read `mem:tech_stack` for tool versions/scripts, `mem:conventions` for project-specific style and patterns, `mem:suggested_commands` for Windows command usage, `mem:task_completion` for done checks.
