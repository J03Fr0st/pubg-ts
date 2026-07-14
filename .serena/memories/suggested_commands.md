# Suggested Commands

## Repository

- Reproducible install: `npm ci`.
- Build declarations/package output: `npm run build`.
- Full test suite: `npm test`; coverage: `npm run test:coverage`.
- Unit tests: `npm run test:unit`; integration tests: `npm run test:integration` (may require `PUBG_API_KEY` and external access).
- Focus one test: `npx jest tests/unit/<file>.test.ts --runInBand`.
- Lint: `npm run lint`; full non-writing Biome validation: `npm run check`.
- Scoped fixes: `npm run lint:fix`; broad format/check writes: `npm run format` or `npm run check:fix` only when intended.
- Dependency audit matching CI: `npm audit --audit-level=moderate`.
- Inspect publish contents: `npm pack --dry-run --json`.
- Generate TypeDoc output: `npm run generate:docs`.
- Generate OpenAPI types only after confirming `api-documentation-content/swagger/openapi.yml` exists: `npm run generate:types`.
- Changesets: `npm run changeset`, `npm run changeset:version`, and `npm run changeset:publish`.

## Serena

- Current CLI: `uvx --from git+https://github.com/oraios/serena serena --version`.
- Refresh symbol index: `uvx --from git+https://github.com/oraios/serena serena project index .`.
- Validate tools/LSP: `uvx --from git+https://github.com/oraios/serena serena project health-check .`.
- Validate memory references: `uvx --from git+https://github.com/oraios/serena serena memories check .`.
- Ensure memory layout: `uvx --from git+https://github.com/oraios/serena serena memories initialize .`.
- On Windows, set `PYTHONUTF8=1` before Serena health/memory commands to avoid cp1252 failures when the CLI prints status symbols.

## Git and inspection

- Start/end with `git status --short --branch --untracked-files=all`.
- Inspect tracked Serena docs with `git ls-files .serena` and ignored cache/logs with `git check-ignore -v .serena/cache .serena/logs`.
- Use `rg --files`, `rg "pattern"`, `Get-Content`, and `Get-ChildItem` for Windows inspection.
- Stage explicit paths, not the whole worktree. Run `git diff --cached --check` and inspect the staged diff before committing.
- Hooks install through `npm run prepare`; do not bypass them unless the user explicitly directs it.
