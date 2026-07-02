# CLAUDE.md — backend (Ktor)

Rules specific to `apps/backend`. The root `CLAUDE.md` and `ARCHITECTURE.md`
still apply; this file adds the Kotlin/Ktor specifics.

## The layering, restated for the agent

Per context (`identity`, `catalog`, `cart`, `ordering`):

```
domain/          entities, value objects, sealed errors — pure Kotlin, NO Ktor / NO Exposed
application/     use cases, repository PORTS (interfaces), transaction boundary
infrastructure/  Exposed tables + repository adapters + domain<->row mappers
api/             Ktor routes, @Serializable DTOs, DTO<->domain mapping
```

`api → application → domain ← infrastructure`. If you find yourself importing a
Ktor or Exposed symbol inside `domain/`, you have made a mistake — stop.

## Non-negotiables

- **Domain purity.** No framework imports in `domain/`. Invariants are enforced
  by constructors — a value object must not be constructible in an invalid state.
- **Exposed DSL, not DAO.** No active-record entities. Persistence shape and
  domain shape are separate; map between them explicitly in `infrastructure/`.
- **Ports owned by `application/`.** A context declares the interface it needs
  (e.g. `ProductPricing`, `StockChecker`); the adapter that satisfies it lives in
  `infrastructure/` and may call another context's *application service* — never
  its tables.
- **Transactions in use cases.** Wrap the transaction in the application layer.
  Never open a `transaction { }` inside a repository or a route handler.
- **Errors are sealed domain types** mapped to HTTP exactly once, in the
  `StatusPages` install. Routes do not build ad-hoc error responses.
- **DTOs are not domain types.** Requests/responses are `@Serializable` DTOs in
  `api/`, mapped to/from domain at the edge. The domain never gets serialized
  directly.

## Cart / ordering specifics

- `mergeCarts(...)` and `placeOrder(...)` are **pure domain functions** that take
  ports as parameters. They return results + adjustment reports; they do not
  perform IO themselves.
- Recompute price and stock server-side on merge and on checkout. Ignore any
  price/total in the request body.
- `placeOrder` is one atomic transaction: re-validate → decrement stock → write
  the immutable order. A placed order is never mutated afterward.
- Merge is idempotent: empty guest cart → no-op; duplicate products → sum then
  clamp to stock.

## When adding an endpoint

1. Define/extend the domain operation (pure function in `domain/` or a use case
   in `application/`).
2. Add the Exposed adapter in `infrastructure/` if persistence changes.
3. Add the route + `@Serializable` DTOs in `api/`.
4. Ensure the OpenAPI emission covers it, then regenerate `packages/api-client`.
   The contract change is not "done" until the client is regenerated.

## Do not, without asking

- Add a new context, or move logic between contexts.
- Reintroduce JPA/Hibernate or Exposed DAO.
- Add Spring, or any DI mechanism beyond the chosen Koin/manual wiring.
- Change the transaction boundary or the cart/order aggregate split.
