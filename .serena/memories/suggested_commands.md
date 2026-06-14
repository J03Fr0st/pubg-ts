# Suggested Commands

- Install deps: `npm install`.
- Build/package types: `npm run build`.
- Run all tests: `npm test`.
- Run unit tests only: `npm run test:unit`.
- Run integration tests only: `npm run test:integration`. Treat as potentially external/API-dependent; inspect test env needs before assuming it is offline-safe.
- Watch tests: `npm run test:watch`.
- Coverage: `npm run test:coverage`.
- Lint: `npm run lint`.
- Format write: `npm run format`.
- Combined Biome check: `npm run check`; write fixes with `npm run check:fix`.
- Generate API docs: `npm run generate:docs`.
- Generate OpenAPI types: `npm run generate:types`; expects `./api-documentation-content/swagger/openapi.yml` to exist.
- Development entrypoint: `npm run dev`; it runs `ts-node src/index.ts`, which is a library export file, not a CLI app.
- Prepare git hooks: `npm run prepare`.
- Release flow scripts: `npm run changeset`, `npm run changeset:version`, `npm run changeset:publish`, `npm run release`.
- Windows repo inspection: prefer `rg --files`, `rg "pattern"`, `Get-ChildItem`, `Get-Content`, and `Select-String`; paths are under `D:\Source\pubg-ts`.
- Before staging in this repo, check dirty state with `git status --short --branch --untracked-files=all`; current onboarding created/uses `.serena/` files and the checkout may already have unrelated untracked files.
- Do not run doc-mentioned commands that are absent from `package.json` (`sync-assets`, `security:*`, `perf:*`, `health:check`) without first verifying they were added.
