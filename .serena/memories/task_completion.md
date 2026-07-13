# Task Completion

- For ordinary code changes, run in this order when feasible: `npm run check`, `npm test`, `npm run build`.
- For focused changes, a narrower loop is acceptable during development: related Jest file(s) or `npm run test:unit`, then finish with broader checks before claiming completion.
- For service/API query construction changes: add/update unit tests under `tests/unit/services/`, verify URL/query strings, then run `npm run test:unit` and `npm run build`.
- For `ClientRuntime`, HTTP transaction, client health, cache, rate limiter, error, security, or asset manager changes: run the matching unit test file(s), then `npm run test:unit`; broader `npm test` if behavior may affect integration tests.
- For public API/export changes: run `npm run build` to verify declarations and public entrypoint compilation.
- For formatting/lint fixes: prefer `npm run check:fix` only when broad write changes are intended; otherwise keep edits scoped and run `npm run check`.
- Do not claim README-documented production checks (`security:*`, `perf:*`, `health:check`, `sync-assets`) unless those scripts exist in the current `package.json` at the time of the task.
- Before committing/staging: run `git status --short --branch --untracked-files=all`; stage only files relevant to the user request, especially because docs/planning artifacts and `.serena/` may be present as separate local changes.
