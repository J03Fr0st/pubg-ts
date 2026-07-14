# Memory Maintenance

## Discovery graph

- Start at `mem:core` for the project map.
- Follow `mem:tech_stack` for executable tooling and CI/release facts.
- Follow `mem:conventions` for domain language, module ownership, security, and code-shape rules.
- Follow `mem:suggested_commands` for verified local, Serena, and Git commands.
- Follow `mem:task_completion` before claiming completion, committing, or updating a PR.
- Memory references use the `mem:` prefix inside backticks and must resolve under `.serena/memories/`.

## Source priority

- Domain terminology: `CONTEXT.md`.
- Public interface and ownership: `src/index.ts`, `src/api/`, public-interface tests, `MIGRATION.md`, and accepted ADRs.
- Commands/dependencies/tooling: `package.json`, lockfile, tool configs, and current CLI help.
- CI/release behavior: `.github/workflows/` plus the commands they execute.
- Historical intent: accepted ADRs first, then current designs/specs; implementation code and tests decide when historical prose has drifted.

## Update triggers

- Refresh memories when public exports, module ownership, domain language, supported Node versions, commands, test structure, CI/release behavior, or Serena configuration changes.
- Keep memories dense and durable. Remove stale claims instead of appending task history; do not duplicate obvious source listings or volatile line-level facts.
- Every tracked memory should describe current repository truth. Task-specific progress belongs in commits, PRs, specs, or implementation logs rather than Serena memories.
- `.serena/project.yml` and `.serena/memories/*.md` are tracked. `.serena/cache/` and `.serena/logs/` are generated and ignored.

## Validation

- Run `serena memories check .` after changing references or filenames.
- Run `serena project health-check .` after project/language configuration changes.
- On Windows set `PYTHONUTF8=1` so Unicode status output does not fail under cp1252.
- Inspect `git diff -- .serena` and `git status --short --branch --untracked-files=all`; commit only the intended tracked Serena files.
