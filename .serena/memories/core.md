# Core

- `@j03fr0st/pubg-ts` is a TypeScript SDK for the PUBG API. The package root is `src/index.ts`; builds emit CommonJS JavaScript, declarations, declaration maps, and source maps under `dist/`.
- `CONTEXT.md` is the binding domain-language source. Use **Client Health**, **Asset Catalog**, and **Match Telemetry** exactly as defined there; do not reintroduce process/synthetic health, remote asset-manager language, or a standalone telemetry domain.
- `PubgClient` in `src/api/client.ts` is the public composition root. Every client owns `players`, `matches`, `seasons`, `leaderboards`, `samples`, one local `AssetCatalog`, and one private `ClientRuntime`; public runtime operations are synchronous `getHealth()` and `clearResponseCache()`.
- Public endpoint modules are `Players`, `Matches`, `Seasons`, `Leaderboards`, and `Samples`. Version 2 intentionally removed the shallow `*Service` aliases and other v1 compatibility facades; see `MIGRATION.md` and `docs/adr/0001-use-v2-for-deep-public-modules.md`.
- `ClientRuntime` is the client-local boundary for response caching, rate limiting, request deduplication, authenticated PUBG requests, unauthenticated telemetry requests, transaction retries, and health-state reduction. Runtime internals are not package-root exports.
- Match Telemetry belongs to `Matches`: `matches.getTelemetry(matchId)` loads the match, requires exactly one valid HTTPS telemetry asset, strips authentication, and bypasses response caching.
- `AssetCatalog` in `src/utils/assets/catalog.ts` performs synchronous lookups over bundled JSON in `src/assets/`. `assetBaseUrl` changes generated image URLs only; there is no remote synchronization or shared singleton.
- `src/api/endpoint-query.ts` centralizes shard paths and query construction. `src/api/http-transaction.ts` owns cache/deduplication/rate-limit/retry/error mechanics. `src/errors/index.ts` owns public PUBG error types.
- Tests are under `tests/unit/` and `tests/integration/`. Unit tests cover the public v2 surface, runtime isolation, health, telemetry security, HTTP transactions, endpoint queries, services, assets, errors, caching, rate limiting, and release artifacts. Integration tests can call the real PUBG API.
- Durable design history lives in `docs/adr/`, `docs/design/`, and `docs/specs/`; `TASK.md` is only a short historical task list. Prefer accepted ADRs and current source over stale prose.
- Related memories: `mem:tech_stack`, `mem:conventions`, `mem:suggested_commands`, `mem:task_completion`, and `mem:memory_maintenance`.
