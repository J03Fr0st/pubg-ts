# Tech Stack

- Runtime/package: Node.js >=18, npm >=8. Lockfile is `package-lock.json`; use npm commands unless user requests otherwise.
- Language: TypeScript 5.9, `strict: true`, CommonJS modules, target ES2020, output `dist/`, declarations/source maps enabled.
- HTTP: axios behind a client-local `ClientRuntime`; services use its `EndpointTransport` boundary, while `HttpTransactionRunner` owns retry, response-cache, deduplication, rate-limit, and error-mapping mechanics. Match telemetry uses the runtime's unauthenticated external transport path.
- Tests: Jest 30 with ts-jest, `testEnvironment: node`, setup in `tests/setup.ts`, test timeout 20s, `forceExit: true`.
- ESM CLI deps (`chalk`, `inquirer`, `ora`) are mapped to local mocks in Jest even though no `src/cli` tree exists in current checkout.
- Formatting/linting: Biome 2.3.6. Formatter uses 2 spaces, LF, line width 100, single quotes in JS/TS, trailing commas `es5`, semicolons always. Biome linter recommended rules; explicit `any` and non-null assertions are allowed.
- Legacy ESLint scripts remain but Biome is canonical for normal work.
- Git hooks: Lefthook pre-commit runs `npx biome check --write {staged_files}` and related Jest tests for staged TS/JS files.
- Docs/release: TypeDoc via `npm run generate:docs`; Changesets commands exist for versioning/publish.
- Asset data is checked in and consumed by the local-only `AssetCatalog`; current `package.json` has no asset sync or prebuild hook. Other security, perf, health, CLI, and scripts claims in older guidance still require verification against the actual tree.
