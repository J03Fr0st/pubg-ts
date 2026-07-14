# Task Completion

- Establish the owned file set with `git status --short --branch --untracked-files=all`; preserve unrelated changes and ignored generated output.
- During implementation, run the narrowest relevant Jest file or suite. Before claiming ordinary code work complete, run fresh `npm run check`, `npm test`, and `npm run build` unless the task has a narrower documented verification contract.
- Service/query changes: test exact paths, filters, pagination, and URL encoding under `tests/unit/services/` or `tests/unit/endpoint-query.test.ts`; then run unit tests and build.
- Runtime/transaction/health/cache/rate-limit changes: exercise client isolation, terminal outcome counting, retry behavior, error mapping, redaction, and cache semantics; then run the full unit suite.
- Match Telemetry changes: verify asset cardinality and HTTPS validation, no authorization/auth leakage, no response caching, redacted errors, and health transitions.
- Asset Catalog changes: verify synchronous bundled-data behavior, search/normalization, configured generated URLs, private derived caches, and no network path.
- Public API changes: update `src/index.ts`, public-interface tests, README/MIGRATION/CHANGELOG as applicable, then run build and `npm pack --dry-run --json` to confirm declarations and package contents.
- CI/release changes: parse YAML, validate embedded shell/JavaScript, check action/CLI inputs against current official documentation, and run the local commands represented by the jobs where feasible.
- Serena docs/config changes: refresh all affected memories, run the Serena project index, health check, and `serena memories check`; set `PYTHONUTF8=1` on Windows.
- Documentation-only changes still require `git diff --check`, link/path review, and any domain-language consistency check relevant to `CONTEXT.md`.
- Before committing: inspect `git diff` and `git diff --cached`, stage only owned files, run `git diff --cached --check`, and allow Lefthook to run normally.
- Before pushing or updating a PR: confirm local HEAD, remote branch HEAD, PR file list, and current check state. Never report pending checks as passing.
