# CLAUDE.md

Operating rules for AI agents working in this repo. Read `ARCHITECTURE.md` first;
this file is the enforcement layer on top of it. The backend has its own
`apps/backend/CLAUDE.md` with rules specific to the Kotlin side.

## What this project is

A small, scalable e-shop demonstrating clean architecture — not a feature race.
**Default to less.** When a task can be solved by adding a feature or by keeping
the system small and legible, keep it small. Prefer maintainable, exitable code
over cleverness.

## Hard invariants — never violate

1. **The OpenAPI spec is the FE/BE contract.** Frontends import types from
   `@ethereal-nature/api-client`. Never hand-write a TS type that mirrors a
   backend DTO. Contract changes start in the backend and regenerate the client.
2. **The server never trusts client-supplied price, total, or stock.** The
   client cart is a list of intents (`productId`, `quantity`). Price and stock
   are always recomputed server-side. `priceSnapshot` on the client is
   display-only.
3. **The dependency rule (backend):** `api → application → domain ← infrastructure`.
   The domain imports nothing framework-related. Ports live in the application
   layer; adapters live in infrastructure.
4. **No cross-context table access.** A context reaches another context only
   through a port + adapter, never by reading its tables or entities directly.
5. **Order is immutable.** Never mutate a placed order. Cart and order are
   separate aggregates.
6. **State ownership is fixed** (see ARCHITECTURE §3.4). Server state → React
   Query. Client ephemera → Zustand. DI values → Context. URL-derivable state →
   search params. Do not mirror server data into Zustand.

## Before you write code

- For any FE/BE boundary change, update the backend DTOs/routes and regenerate
  `packages/api-client`. Do not patch the generated client by hand.
- For a new backend capability, identify which **context** it belongs to. If it
  doesn't fit cleanly into `identity / catalog / cart / ordering`, stop and ask
  rather than smearing logic across contexts.
- For a new FE feature, place it in the correct **feature slice**. Do not add to
  a global `components/` or `utils/` bucket.

## What you may do freely

- Add components, hooks, and pure functions within an existing feature slice or
  context layer.
- Write tests (domain logic is pure — test it directly, no mocks needed).
- Refactor within a layer as long as the dependency rule holds.

## What requires explicit sign-off (ask first)

- Adding a new bounded context or a new top-level package/app.
- Changing the transaction boundary, the merge policy, or the cart/order
  aggregate split.
- Introducing a new dependency, especially anything that competes with the
  settled stack (no MUI, no alternative data-fetching lib, no second router).
- Promoting a context to its own Gradle subproject.
- Anything that would make a frontend aware of backend internals.

## Stack (settled — do not substitute without an ADR)

- Monorepo: pnpm + Turborepo (TS), Gradle (backend), separate build graphs.
- Frontends: TanStack Start (both), TanStack Router, React Query, Zustand.
- Styling: Tailwind + headless primitives + TanStack Table. **No MUI.**
- Backend: Ktor, Exposed (DSL), kotlinx.serialization, Koin, Flyway, Postgres.
- Contract: OpenAPI → generated `api-client`.

## When unsure

Stop and surface the question. A short clarifying question is always cheaper
than a change that violates an invariant and has to be unwound.
