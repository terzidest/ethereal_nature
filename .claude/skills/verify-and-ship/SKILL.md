---
name: verify-and-ship
description: The pre-push verification gate and PR process for this repo — forced turbo gate, exit-code discipline, shared-DB test quirks, branch-per-PR. Use before committing/pushing any change.
---

# Verify and ship

## The gate

```bash
pnpm turbo run build typecheck lint test --force
```

- **`--force` is mandatory.** A stale turbo cache has masked real lint errors
  before; a cached green is not a green.
- **Capture the gate's own exit code.** Never judge success through a pipe:
  `… 2>&1 | tail` reports tail's exit status, which once let a failing
  typecheck get committed. Run the gate, save `$?`, read the log separately.
- Server tests run against the real local Postgres (`ethereal_nature`,
  shared with dev), single-threaded. They leave test products behind and
  drain seed stock — expected; see `docs/DEVELOPMENT.md`.
- If the workspace was switched to a production install (`pnpm deploy
  --prod`), the gate fails oddly — rerun `pnpm install` first.

## Process

1. Branch off fresh `main` per change: `git checkout main && git pull
   --ff-only && git checkout -b <type>/<name>`.
2. Gate green → commit → push → `gh pr create` with a body that states what
   changed, why, and how it was verified.
3. CI runs the same gate. Railway deploys `main` after CI passes, scoped by
   watch paths (`docs/DEPLOY.md`) — after merging, verify the live artifact
   actually changed before trusting it.
4. Generated files (`packages/api-client/src/generated/`, `routeTree.gen.ts`)
   are committed but never hand-edited. If `routeTree.gen.ts` is dirty from a
   typecheck run with no route changes, `git checkout --` it.

## Watch out

- Don't commit build artifacts: check `git status` file counts before
  `git add -A` (806 Gradle files nearly shipped once; stray `.gradle/` dirs
  from the decommissioned Kotlin backend are now gitignored).
- Force-pushing rewrites shared history — fix mistakes with a follow-up
  commit on the branch instead.
