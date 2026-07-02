# ethereal_nature

A small e-shop built to demonstrate clean, scalable architecture — not feature
breadth. The domain is intentionally shallow (catalog, cart, ordering,
identity); the structure around it is the point.

## Stack

- **Monorepo:** pnpm + Turborepo (TS side), Gradle (backend) — separate build
  graphs, joined only by the API contract.
- **Frontends:** TanStack Start (storefront + admin), TanStack Router, React
  Query, Zustand, Tailwind + headless primitives + TanStack Table.
- **Backend:** Ktor + Kotlin, Exposed (DSL), kotlinx.serialization, Koin,
  Flyway, Postgres.
- **Contract:** OpenAPI → generated `packages/api-client`.

## Layout

```
apps/storefront    public SSR/prerender store
apps/admin         authenticated SPA dashboard
apps/backend       Ktor, bounded contexts
packages/api-client  generated types + React Query hooks
packages/ui          shared Tailwind components + tokens
packages/config      shared lint/ts/tailwind presets
docs/adr             decision records
```

## Read next

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — canonical reference: contract, FE/BE
  structure, bounded contexts, the cart→login→order flow.
- **[ROADMAP.md](ROADMAP.md)** — phased, exitable build plan (contract-first,
  read paths before write paths).
- **[CLAUDE.md](CLAUDE.md)** — operating rules and hard invariants for agents.
- Per-app agent guardrails:
  [storefront](apps/storefront/CLAUDE.md) ·
  [admin](apps/admin/CLAUDE.md) ·
  [backend](apps/backend/CLAUDE.md).
- **[docs/adr/](docs/adr/README.md)** — why each decision was made.

## The one rule worth memorising

The server never trusts a client-supplied price, total, or stock. The client
cart is a list of intents; the backend is the source of truth for money and
availability — always recomputed at merge and at checkout.
