# CLAUDE.md — server (Fastify)

Rules specific to `apps/server`. The root `CLAUDE.md` and `ARCHITECTURE.md`
still apply; this file adds the TypeScript/Fastify specifics. (This backend is
the Fastify port of the original Kotlin/Ktor implementation — ADR-0010; the
Kotlin version lives at the `kotlin-final` tag.)

## The layering, restated for the agent

Per context (`identity`, `catalog`, `cart`, `ordering`, `payments`), one file
per layer:

```
domain.ts          types, invariants (domainRequire), sealed AppError subclasses — pure TS, NO fastify/kysely imports
use-cases.ts       use cases + the PORTS (interfaces) they own
infrastructure.ts  Kysely repositories + adapters onto other contexts' use cases
routes.ts          Fastify routes; schemas DERIVED from the committed contract via opSchema
```

`routes → use-cases → domain ← infrastructure`. If you import fastify or
kysely inside `domain.ts`, you have made a mistake — stop.

## Non-negotiables

- **The committed `packages/api-client/openapi.json` IS the contract and the
  runtime schema source** (`platform/contract.ts`). Never hand-write a route
  body/response schema, never add `@fastify/swagger`, never edit the spec to
  match code — code matches spec. The op↔route bijection test enforces this.
- **Null-omission convention:** DTO mappers produce `undefined` (never `null`)
  for absent optional fields — fast-json-stringify then omits them, matching
  the original kotlinx `explicitNulls=false` wire format.
- **Ambient transactions** (`platform/db/transaction.ts`): use cases wrap work
  in `tx.run()`; repositories execute on `tx.getExecutor()`. Nested `run()`
  JOINS the outer transaction — cross-context flows (placeOrder, the payment
  webhook) depend on this. Never open transactions in repositories or routes;
  never fire-and-forget promises inside `run()`.
- **Ports per context.** A context declares the interfaces it needs in its own
  files; adapters call another context's *use cases*, never its tables. The
  composition root is `app.ts` — plain construction, no DI framework.
- **Errors are AppError subclasses** mapped to HTTP exactly once, in
  `platform/errors.ts`. Routes never build ad-hoc error responses.
- **pg trap** (`platform/db/client.ts`): never pass `user`/`password` options
  alongside `connectionString` — pg silently ignores them. `poolOptions()`
  parses the URL itself; regression-tested.
- **Query-param leniency:** list endpoints drop the AJV querystring schema and
  hand-parse (Ktor-parity: bad values default instead of 400). Body/path/
  response schemas stay contract-derived.

## Testing

- vitest against **real Postgres** (same DB as dev), single-threaded; HTTP
  behavior via `app.fastify.inject()` through `startTestApp()` in
  `test/helpers.ts`. Domain logic is pure — test it directly.
- The transaction-soundness suite (`payments.test.ts`) and the contract
  bijection suite (`contract-gate.test.ts`) are the migration's safety proofs
  — extend them when touching transactions or routes.

## Migrations

Plain SQL files in `migrations/` (`V<n>__name.sql`), applied by
`platform/migrate.ts` into a Flyway-compatible `flyway_schema_history` table.
Applied migrations are immutable — new changes get a new version.

## When adding an endpoint

1. **Contract first:** add the operation + schemas to
   `packages/api-client/openapi.json`, regenerate the client (`pnpm
   generate:client` against a running server — or hand-edit the spec and
   regenerate from the file).
2. Domain operation / use case, then repository, then the route wired with
   `opSchema(...)`.
3. Tests: domain + inject coverage incl. the error codes.
4. The bijection test will fail until spec and routes agree — that's the point.

## Do not, without asking

- Add a new context, or move logic between contexts.
- Introduce an ORM/active-record layer, a DI framework, or @fastify/swagger.
- Change the transaction boundary or the ambient-transaction design.
- Make any contract change without regenerating the client in the same PR.
