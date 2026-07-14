# Tech Stack

- Runtime/package floor: Node.js >=18 and npm >=8. Use `package-lock.json` with `npm ci` for reproducible verification; CI tests Node 18, 20, 22, and 24, while maintenance and release jobs run Node 24.
- Language: TypeScript 5.9 in strict mode, CommonJS modules, ES2020 target, Node module resolution, JSON imports, declarations, declaration maps, and source maps.
- HTTP/runtime: axios powers authenticated PUBG requests and a separate authentication-stripping telemetry adapter. `ClientRuntime` composes `HttpTransactionRunner`, `MemoryCache`, `RateLimiter`, `RequestDeduplicator`, and `ClientHealthState` per client.
- Assets: bundled JSON dictionaries/enums plus Fuse.js-backed local search. Builds do not fetch or synchronize asset data.
- Validation/errors: validator utilities and typed `Pubg*Error` classes. Public error metadata must remain redacted; telemetry URLs and credentials must not leak through errors or health snapshots.
- Tests: Jest 30 with ts-jest, Node environment, `tests/setup.ts`, 20-second timeout, forced exit, and local mocks for ESM-only CLI packages. Unit and integration suites have separate npm scripts.
- Quality: Biome 2.3.6 is canonical. Formatting uses 2 spaces, LF, 100 columns, single quotes for JavaScript/TypeScript, ES5 trailing commas, and semicolons. Legacy ESLint scripts remain but are not CI gates.
- Hooks: Lefthook formats/checks staged TS/JS/JSON with Biome and runs related Jest tests for staged TS/JS. `--no-errors-on-unmatched` keeps config/docs-only commits valid.
- Documentation: TypeDoc generates API docs from `src/index.ts`; `CONTEXT.md`, `MIGRATION.md`, README, ADRs, designs, and specs are maintained source documents.
- Release: Changesets versions and publishes the npm package. On a successful publish, `.github/workflows/release.yml` uses `gh release create` with the matching `CHANGELOG.md` section and generated comparison notes.
- CI: `.github/workflows/ci.yml` runs lint, build, coverage, Codecov upload, `npm audit --audit-level=moderate`, and a full Biome check.
- Serena: project name `pubg-ts`, TypeScript LSP backend, workspace root `.`, tracked project configuration/memories, and ignored `.serena/cache/` plus `.serena/logs/`.
