# Conventions

- Keep changes surgical; project AGENTS.md emphasizes explicit assumptions, minimum code, no speculative abstractions, and every changed line tracing to the task.
- Public API flows through `src/index.ts`; add exports there only when intentionally exposing new SDK surface.
- Service pattern: add endpoint behavior as a method on the matching `src/api/services/*Service`; services receive an `EndpointTransport` and shard/config through constructor injection and build paths with `URLSearchParams` for query parameters.
- Route PUBG API calls through the client-local `ClientRuntime` transport so rate limiting, response caching, retry behavior, domain error mapping, and health state stay consistent without sharing runtime state across clients.
- Error classes live in `src/errors/index.ts`; map new domain failures to existing `Pubg*Error` classes where possible before adding new classes.
- Asset data/types under `src/assets/` and `src/types/assets/` are treated as generated/static catalog surfaces. Do not hand-edit generated asset catalogs unless the task explicitly targets them and generation source is verified.
- Use the root-exported `AssetCatalog` or `client.assets` for synchronous lookups. Its implementation is `src/utils/assets/catalog.ts`; data is always local, `assetBaseUrl` changes generated URLs only, derived caches are private, and no facade singleton or remote sync path exists.
- Tests should mirror source areas under `tests/unit/` or `tests/integration/`. New behavior should include normal, edge, and failure/error coverage when practical.
- Biome style is canonical: 2 spaces, LF, 100 columns, single quotes, semicolons, trailing commas where valid in ES5.
- Public functions/classes/modules should have clear documentation comments when adding new exported API, matching existing service method style.
- Keep files under 500 lines where practical; if a task would grow a large file substantially, consider a focused helper module instead of broad refactoring.
- README/AGENTS contain stale or aspirational sections. When in conflict, prefer verified files (`package.json`, actual `src/` tree, tests) over docs that reference missing scripts/CLI folders.
