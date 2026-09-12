# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

🔄 Project Awareness & Context
- Always review project planning and architecture documents (e.g., PLANNING.md) at the start of a new task or conversation.
- Check the task list (e.g., TASK.md) before starting work. If your task isn't listed, add it with a brief description and today's date.
- Follow established naming conventions, file structures, and architectural patterns as described in project documentation.

🧱 Code Structure & Modularity
- Avoid files longer than 500 lines. If a file grows too large, refactor by splitting it into smaller modules or helper files.
- Organize code into clearly separated modules or files, grouped by feature or responsibility.
- Use clear and consistent import/include/require statements as appropriate for the language and project.

🧪 Testing & Reliability
- Always create unit tests for new features (functions, classes, routes, etc.), using the preferred testing framework for the language.
- After updating any logic, review and update existing tests as needed.
- Place tests in a dedicated tests directory that mirrors the main code structure.
- For each feature, include at least:
  - One test for expected/typical use
  - One edge case test
  - One failure or error case test

✅ Task Completion
- Mark completed tasks in the task list (e.g., TASK.md) immediately after finishing them.
- Add any new sub-tasks or TODOs discovered during development to the task list under a "Discovered During Work" section.

📎 Style & Conventions
- Follow the official or community style guide for the language in use (e.g., PEP8, Google Java Style, Airbnb JavaScript Style).
- Use consistent naming conventions for variables, functions, classes, and files (e.g., camelCase, snake_case, PascalCase) as appropriate.
- Write clear, descriptive names for all identifiers; avoid unnecessary abbreviations.
- Indent code consistently (spaces or tabs as per project/language standard).
- Limit line length to 80–120 characters, depending on language norms.
- Use comments to explain non-obvious logic, intent, and complex algorithms.
- Write documentation comments for all public functions, classes, and modules.
- Group related code by feature or responsibility.
- Remove dead code and unused variables/functions promptly.
- Prefer immutability and pure functions where practical.
- Avoid deep nesting; refactor complex logic into smaller functions.
- Use version control best practices: small, focused commits with clear messages.
- Ensure code is understandable and maintainable by others.

📚 Documentation & Explainability
- Update project documentation (e.g., README.md) when new features are added, dependencies change, or setup steps are modified.
- Comment non-obvious code and ensure everything is understandable to a mid-level developer.
- When writing complex logic, add inline comments explaining the "why," not just the "what."

🧠 AI/Automation Behavior Rules
- Never assume missing context; ask questions if uncertain.
- Never invent or hallucinate libraries, functions, or APIs—only use known, verified components.
- Always confirm file paths and module names exist before referencing them in code or documentation.
- Never delete or overwrite existing code unless explicitly instructed or if it is part of a documented task.



## Common Development Commands

### Building and Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/`
- `npm run dev` - Run the application in development mode with ts-node
- `npm run prepare` - Install Lefthook Git hooks

### Testing
- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run only unit tests in `tests/unit/`
- `npm run test:integration` - Run only integration tests in `tests/integration/`

### Code Quality
- `npm run lint` - Lint code with Biome
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Biome
- `npm run check` - Run both linting and formatting checks
- `npm run check:fix` - Fix both linting and formatting issues

### Legacy ESLint (if needed)
- `npm run legacy:lint` - Lint with ESLint
- `npm run legacy:lint:fix` - Fix ESLint issues

### Asset Catalog
- The checked-in JSON under `src/assets/` is the only source of Asset Catalog data; there is no asset sync or prebuild command.
- `npm run generate:asset-types` - Regenerate the identifier types under `src/types/assets/` from that JSON. Run it after editing any bundled JSON.
- `npm run check:asset-types` - Verify generated types without writing files; CI checks this projection.
- `assetBaseUrl` controls generated image URLs only and never changes catalog data.

### Documentation
- `npm run generate:docs` - Generate TypeDoc API documentation
- `npm run generate:types` - Generate TypeScript types from OpenAPI specification

## Code Architecture

### Domain Language
`CONTEXT.md` defines the domain terms (Client Health, Asset Catalog, Match Telemetry, Endpoint Target, Request Outcome, Season Activity, Request Runtime). Use them in code, tests, and docs. `docs/adr/` records architecture decisions; do not re-litigate them without a new ADR.

### Core Structure
This is a TypeScript SDK for the PUBG API.

**Main Client (`src/api/client.ts`)**
- `PubgClient` - Entry point that composes the endpoint modules, the Asset Catalog, and one client-local Request Runtime
- Exposes `getHealth()` (synchronous, redacted Client Health) and `clearResponseCache()`

**Request Runtime (`src/api/runtime/`)**
- `client-runtime.ts` - `ClientRuntime`: the one module that owns a client's response cache, rate limiter, request deduplication, retry policy, and Client Health. It implements the internal `EndpointTransport`/`MatchTransport` seam. Every optional `PubgClientConfig` default is resolved once, at construction.
- `request-failure.ts` - Pure interpretation of a failed adapter call into a `RequestFailure` (drives retry, Client Health, and error mapping from one decode) plus the error mappers. Telemetry errors never echo the request URL.
- `cache.ts`, `rate-limiter.ts`, `request-deduplicator.ts`, `logger.ts` - The runtime's collaborators; nothing outside the runtime imports them
- No request state lives outside a `ClientRuntime` instance; two clients never share a cache or limiter

**Endpoint Target and transport seam (`src/api/`)**
- `endpoint-query.ts` - `endpointTarget()` builds a branded `EndpointTarget` (shard-scoped, fully encoded path and query; identifiers stay single path segments). `describeEndpointTarget()` decodes one for verification in tests.
- `endpoint-transport.ts` - `EndpointTransport.get(target)` and `MatchTransport.fetchTelemetry(url)`. Only `Matches` sees the wider seam. Production adapter: `ClientRuntime`; test adapter: a five-line fake. Not exported from the package root.
- `client-health.ts` - `ClientHealthState` reducer: `record(outcome)` + `snapshot()`; the public `ClientHealth` types

**Endpoint modules (`src/api/services/`)**
- `Players`, `Matches`, `Seasons`, `Leaderboards`, `Samples` - one class per PUBG endpoint family, each depending only on the transport seam and `endpointTarget`
- `Matches.getTelemetry()` owns Match Telemetry discovery: exactly one HTTPS asset, fetched without PUBG credentials or caching
- Explicit domain failures use typed `Pubg*Error` classes from `src/errors/`; use those classes when adding validation. Malformed inputs outside the validated cases can still produce native JavaScript errors.

**Asset Catalog (`src/utils/assets/`)**
- `catalog.ts` - `AssetCatalog`, also available as `PubgClient.assets`. Synchronous, local-only lookups over the bundled JSON; named lookup methods are the intended interface (decided in v2)
- `normalization.ts` - Category, humanization, date, and Season Activity policy. `isOffseasonEndDate()` is the single interpretation of the `'00-00-0000'` open-ended season sentinel
- `search.ts` - Fuse.js item search index
- Failure contract: item/vehicle info lookups validate IDs, season lookups validate platforms, and survival-title lookup validates ratings, using `PubgAssetError`/`PubgConfigurationError`. Item/vehicle info, active-season, and survival-title lookups return `null` when no result matches. Name lookups expect strings without validating malformed inputs and use humanized or original identifiers as fallbacks.
- `getActiveSeason()` reads Season Activity from bundled dates; `client.seasons.getCurrentSeason()` asks PUBG. They are different questions

**Type Definitions (`src/types/`)**
- PUBG response types organized by domain (players, matches, seasons, leaderboard, telemetry, common)
- `src/types/assets/` is generated — see Bundled Asset Data below

**Error Handling (`src/errors/`)**
- One hierarchy rooted at `PubgApiError`: `PubgRateLimitError`, `PubgAuthenticationError`, `PubgNotFoundError`, `PubgValidationError`, `PubgCacheError`, `PubgAssetError`, `PubgConfigurationError`, `PubgNetworkError`

### Key Design Patterns
- **Deep modules behind narrow seams**: endpoint modules see only `EndpointTransport`; callers see only `PubgClient` and `AssetCatalog`
- **One interpretation per failure**: `interpretFailure()` decodes a rejection once; retry, Client Health, and error mapping all consume that `RequestFailure`
- **One logical request**: retries take rate-limit slots but record a single outcome, so counters and Client Health never flap
- **Redaction by construction**: telemetry requests strip every header and Basic auth at the adapter; public errors never carry the original error or telemetry URL
- **Bundled data, generated types**: JSON is the truth; `src/types/assets/` is derived from it

### Testing Strategy
- **The interface is the test surface**: endpoint modules are tested through a transport fake (`tests/unit/services/transport-fake.ts`) and assert decoded Endpoint Targets, not encoded strings
- **Runtime**: `tests/unit/runtime/client-runtime.test.ts` covers cache, dedup, retry, error mapping, Client Health, redaction, and production adapters. `runtime-contracts.test.ts` adds expiry and timeout regressions; both use real runtime collaborators and localhost servers for network behavior.
- **Mocking**: `tests/__mocks__/axios.ts` is auto-applied to every test; files that need the real adapter start with `jest.unmock('axios')`
- **Setup**: Common test setup in `tests/setup.ts`
- **Integration**: `tests/integration/` runs only with `PUBG_API_KEY` set

### Configuration
- Uses Biome for linting and formatting (replaces ESLint/Prettier)
- Jest for testing with TypeScript support
- Lefthook for pre-commit hooks (Biome check + related tests)
- Target: ES2020, Node.js 18+
- Runtime dependencies: `axios`, `debug`, `fuse.js` — nothing else ships to consumers

### Bundled Asset Data
`AssetCatalog` reads the checked-in JSON under `src/assets/`. The package has no runtime fetch, sync command, or prebuild sync hook.

**Bundled Data (`src/assets/`, the source of truth)**
- `seasons.json` - All season data by platform
- `survival-titles.json` - Survival title and rating information
- `dictionaries/` - Item, vehicle, map, game-mode, and damage name mappings
- `enums/` - Telemetry enumerations

**Generated Types (`src/types/assets/`, do not edit by hand)**
- Produced by `scripts/generate-asset-types.js` (`npm run generate:asset-types`)
- `items.ts` (`ItemId`), `vehicles.ts` (`VehicleId`), `maps.ts` (`MapId`, `MapName`), `seasons.ts` (season interfaces, `Platform`), `enums.ts` (telemetry enum unions)

### Client Health
Each `PubgClient` owns a `ClientRuntime`; request state is not shared across client instances.

**Health Snapshot (`getHealth()`)**
- Returns synchronously with redacted status, reason, transition time, and request counts
- Includes response-cache size, capacity, hits, misses, and hit rate
- Includes the last-known rate-limit remaining count, limit, and reset time
- Reflects real request and telemetry outcomes without synthetic checks, background timers, or environment-specific monitoring variants

### Debug Logging
Enable debug logging with `DEBUG=pubg-ts:*` environment variable.
Available namespaces: `http`, `cache`, `client`.

## Development Workflow

### Before Making Changes
1. **Run full test suite**: `npm test`
2. **Check build**: `npm run build`
3. **Lint code**: `npm run check`

### When Adding New Features
1. **Write tests**: Maintain coverage - add unit tests in `tests/unit/`, mirroring the source path
2. **Update assets intentionally**: Edit the JSON under `src/assets/`, then run `npm run generate:asset-types`; never hand-edit `src/types/assets/`
3. **Record decisions**: Add domain terms to `CONTEXT.md` and architecture decisions to `docs/adr/`

### When Modifying Endpoint Modules
- **Transport**: Depend on `EndpointTransport` (or `MatchTransport` for Matches) and build targets with `endpointTarget`
- **Error Handling**: Throw typed errors from `src/errors/`; document them with `@throws`
- **Caching and rate limiting**: Handled inside `ClientRuntime`; endpoint modules never touch them

### Working with Assets
- **Local Only**: Use `AssetCatalog` through the package root or `client.assets` for synchronous bundled-data lookups
- **Type Safety**: All asset IDs have union types - use `ItemId`, `VehicleId`, `MapId`
- **Fuzzy Search**: Built-in search capabilities via `fuse.js` integration
- **Configuration**: Use `assetBaseUrl` only to configure generated image URLs; derived caches remain private

### Security Guidelines
- **API Key Protection**: Never log or expose API keys in error messages; public errors must not carry the original adapter error
- **Telemetry**: External telemetry requests must never inherit the authenticated Axios instance or global Axios defaults
- **Dependency Security**: Run `npm audit` before releases

## Important File Locations

### Core Architecture
- `src/api/client.ts` - Main `PubgClient` entry point
- `src/api/runtime/client-runtime.ts` - Client-local Request Runtime and health snapshots
- `src/api/runtime/request-failure.ts` - Failure interpretation and error mapping
- `src/api/endpoint-query.ts` - Endpoint Target construction and decoding
- `src/api/endpoint-transport.ts` - Internal transport seam
- `src/api/services/` - Endpoint modules

### Asset Catalog
- `src/utils/assets/catalog.ts` - Local-only `AssetCatalog` and `AssetCatalogConfig`
- `src/utils/assets/normalization.ts` - Category, humanization, and Season Activity policy

### Scripts
- `scripts/generate-asset-types.js` - Regenerates `src/types/assets/` from `src/assets/`
- `scripts/clean.js` - Removes `dist/` before a build

### Generated Code (Do Not Edit Manually)
- `src/types/assets/` - Generated from `src/assets/` by `scripts/generate-asset-types.js`

### Testing
- `tests/unit/` - Unit tests mirroring `src/` (`runtime/`, `services/`)
- `tests/integration/` - End-to-end API testing
- `tests/__mocks__/` - Mock implementations for testing
