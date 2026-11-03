# Local development runbook

Operational knowledge for running and verifying the stack locally. The
architecture itself lives in `ARCHITECTURE.md`; the rules in `CLAUDE.md`.

## Processes & ports

| What | Port | Start with |
|------|------|------------|
| API (Fastify) | 8080 | `pnpm --filter @ethereal-nature/server dev` (tsx watch) |
| storefront (SSR) | 3000 | `pnpm --filter @ethereal-nature/storefront dev` |
| admin (SPA) | 3001 | `pnpm --filter @ethereal-nature/admin dev` |

Gotchas:
- **`pnpm start` in `apps/server` runs compiled `dist/` — usually stale.**
  For an ad-hoc source-true server use `pnpm exec tsx src/server.ts`.
- **Orphaned dev processes** survive terminated sessions and squat on ports.
  If behavior looks stale, check `lsof -nP -iTCP:<port> -sTCP:LISTEN` and kill
  before assuming a code problem.
- The storefront/admin read `VITE_API_URL` (default `http://localhost:8080`);
  the admin's "View on site" reads `VITE_STOREFRONT_URL` (default
  `http://localhost:3000`). hey-api captures the base URL **when query options
  are created**, so query-option factories must be called lazily (see
  `apps/storefront/src/routes/index.tsx` for the pattern and comment).

## Database

Local Postgres (brew), database `ethereal_nature`, **shared between dev and
the server test suite** (vitest runs single-threaded against it). Migrations
are plain `apps/server/migrations/V<n>__name.sql`, applied on boot by
`platform/migrate.ts` into a Flyway-compatible history table. Applied
migrations are immutable — new change, new version.

Consequences of the shared DB:
- Tests leave artifacts (e.g. `Cart Herb <timestamp>` products) that show up
  on local catalog page 1 and in "New arrivals". Harmless; query with `?q=`
  when you need a clean view.
- Tests drain seed-product stock over time. Restore via psql if a flow needs
  stock (seed baselines: forest-berry 57, lapsang 26, lavender 57).

## Accounts

Dev bootstrap accounts are seeded on boot (config defaults; see
`apps/server/src/platform/config.ts`): an ADMIN (`admin@ethereal.dev`) and,
when demo login is enabled, a VIEWER reachable via `POST /auth/demo` (the
"Explore the demo" button). Customers are self-registered. Never reuse these
conventions against production — live credentials live outside the repo.

## Verification gate (before every push)

```bash
pnpm turbo run build typecheck lint test --force
```

- `--force` is mandatory: a stale turbo cache has masked real lint errors.
- Capture the gate's own exit code. **Never** judge success through a pipe
  (`… 2>&1 | tail` reports tail's exit code, not the gate's) — this once let
  a failing typecheck get committed.
- `pnpm deploy --prod` flips the workspace to a production install; if a gate
  mysteriously fails afterwards, rerun `pnpm install`.

## Process

Every change branches off `main` and lands via PR (CI must pass; Railway
deploys `main` after CI — see `docs/DEPLOY.md`). Repeatable workflows have
skills in `.claude/skills/` (add-block, contract-change, verify-and-ship).
