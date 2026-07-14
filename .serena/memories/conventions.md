# Conventions

- Read `CONTEXT.md` before naming or reshaping SDK concepts. Treat its definitions and avoid-list terms as a contract across code, tests, docs, release notes, and future memories.
- Keep the v2 ownership model deep: `PubgClient` composes client-local state; endpoint modules own domain behavior; Matches owns Match Telemetry; `AssetCatalog` owns local asset lookup. Do not restore v1 aliases or expose runtime implementation classes.
- Public exports are deliberate and centralized in `src/index.ts`. Any package-root addition or removal requires public-interface tests, declarations/build verification, migration consideration, and user-facing documentation.
- Endpoint modules receive the internal `EndpointTransport` and shard through constructor injection. Build paths and query strings with helpers from `src/api/endpoint-query.ts` and `URLSearchParams`; do not duplicate HTTP mechanics in services.
- Route authenticated PUBG calls through `ClientRuntime`/`HttpTransactionRunner` so retries, response caching, request deduplication, rate limiting, errors, and Client Health remain consistent and client-local.
- Match Telemetry fetches must use the resolved HTTPS asset, omit PUBG authorization and Axios auth defaults, bypass response caching, and preserve secret redaction on failures.
- Prefer existing `Pubg*Error` classes from `src/errors/index.ts`. Error contexts and Client Health are stable public surfaces; never include API keys, authorization headers, raw secret-bearing telemetry URLs, or hosting-process state.
- Asset lookups are synchronous and local. `assetBaseUrl` controls generated URLs only; do not add network syncing, a shared catalog singleton, or public cache-management facades without an explicit new design decision.
- Mirror source responsibilities in `tests/unit/`; use transport/runtime adapters instead of real network calls. Keep real PUBG API scenarios in `tests/integration/` and document required environment variables.
- Follow Biome and EditorConfig: 2 spaces, LF, 100-column code width, single quotes, semicolons, organized imports, and ES5-valid trailing commas. Use type-only imports where appropriate.
- Add JSDoc to new public API and non-obvious internal boundaries. Explain ownership, security, or invariants rather than restating code.
- Verify claims against `package.json`, current source, tests, workflows, and accepted ADRs. README, CONTRIBUTING, examples, and historical plans may lag and must not override executable truth.
- Keep changes and staging task-scoped. Generated `dist/`, coverage, Serena cache/logs, and unrelated planning artifacts stay out unless the task explicitly owns them.
