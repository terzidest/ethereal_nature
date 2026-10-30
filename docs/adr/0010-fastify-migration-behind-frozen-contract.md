# ADR-0010: Backend migrated Ktor → Fastify behind the frozen contract

**Status:** Accepted · Supersedes [ADR-0005](0005-ktor-over-spring-boot.md)

## Context
The Kotlin/Ktor backend (ADR-0005) was built deliberately as a learning
vehicle and worked well: five bounded contexts, 67 tests, live on Railway
since July 2026. Two forces prompted replacing it:

1. **Stack alignment.** The project is a portfolio flagship, and the target
   roles are full-stack React + Node. The flagship's backend should be in the
   stack it advertises.
2. **Fleet cost.** A JVM service idles at ~350MB+; Node at ~100MB. With more
   apps planned on the same Railway account, an all-Node fleet is leaner.

The decisive constraint: the migration had to prove ADR-0004's claim that the
OpenAPI contract is the real FE/BE boundary — meaning **zero frontend
changes**, verified mechanically, not by hand-waving.

## Decision
Rewrite the backend as `apps/server` (Fastify 5, TypeScript, Kysely, pg,
vitest) behind the **frozen contract**, then cut over in place.

Key design choices:
- **The committed `openapi.json` is the runtime source of truth.** The server
  registers the spec's component schemas, derives every route's
  validation/serialization schema from its operations, and serves the file
  verbatim at `/openapi.json`. Nothing re-derives the spec (`@fastify/swagger`
  deliberately absent). This made the acceptance gate achievable *by
  construction*: regenerating the api-client against the new backend had to —
  and did — produce a **zero-byte diff**. An op↔route bijection test guards
  the one remaining drift risk.
- **Ambient transactions via `AsyncLocalStorage`.** Exposed's thread-local
  `transaction {}` (which cross-context flows like checkout and the payment
  webhook rely on for atomicity) is mirrored by an ALS-carried Kysely
  transaction; nested `run()` calls join the outer transaction. Proven by
  sabotage tests: a webhook partial failure rolls back the intent settle and
  the order status together.
- **Credential/token continuity.** bcrypt `$2a$` cost-12 hashes verify
  through bcryptjs; JWTs carry the identical claim set — tokens issued by the
  Kotlin backend verified on the Fastify backend and vice versa, live.
- **Per-context ports kept** (ARCHITECTURE §4.3): each context declares its
  own 3-line `TransactionRunner`/gateway interfaces; structural typing lets
  one shared implementation satisfy them from the composition root.

Migration shape: seven incremental PRs on main (scaffold, then one context
each in dependency order, each with its Kotlin tests ported and green against
real Postgres), while the Kotlin backend kept serving production. Cutover =
flipping `RAILWAY_DOCKERFILE_PATH` on the backend service; rollback stayed one
variable-flip away for the stability window.

## Consequences
- The polyglot-monorepo story (ADR-0001/0005) is traded for a stronger one:
  a contract-first migration with mechanical proof. The final Kotlin state is
  preserved at the **`kotlin-final`** tag.
- The TS workspace now owns everything: one language, one CI job, one
  toolchain. The Gradle build graph is gone.
- Terminology mapping for older docs: Exposed→Kysely, Koin→plain composition
  root (`app.ts`), StatusPages→the platform error handler, `testApplication`→
  `fastify.inject`, Flyway→a small Flyway-compatible migrator over the same
  V*.sql files (now in `apps/server/migrations`).
- Found and fixed along the way: the admin order status filter had been a
  silent no-op since phase 5 (Exposed `.where()` return discarded), and pg's
  connectionString-plus-overrides trap cost one failed deploy (now pinned by
  regression tests).
- What we gave up: Kotlin's compiler-enforced invariants (value classes,
  exhaustive sealed hierarchies) are now TS conventions (branded types,
  discriminated unions, `domainRequire`) — same discipline, softer teeth.
