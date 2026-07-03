# Architecture

`ethereal_nature` is a deliberately small e-shop, built to demonstrate a clean,
scalable architecture rather than feature breadth. The domain is intentionally
shallow (catalog, cart, ordering, identity); the structure around it is the
actual subject.

This document is the canonical reference. When code and this document disagree,
one of them is a bug — fix the code or update this document, never let them
drift silently.

---

## 1. System shape

A polyglot monorepo: TypeScript frontends + a Kotlin/Ktor backend, sharing a
single API contract and nothing else.

```
/apps
  /storefront     TanStack Start — SSR/prerender, public, SEO-critical
  /admin          TanStack Start — SPA mode, behind auth, CRUD-heavy
  /backend        Ktor (Gradle) — self-contained, owns the domain
/packages
  /api-client     Generated TS types + React Query hooks (from OpenAPI)
  /ui             Tailwind + headless primitives, design tokens
  /config         Shared eslint / tsconfig / tailwind presets
/docs
  /adr            Architecture Decision Records
```

### Two build graphs, on purpose

The TS side is a **pnpm workspace orchestrated by Turborepo**. The backend is a
**Gradle project**. They do not share a build graph and are not unified under a
single orchestrator. This is a deliberate decision (see ADR-0001): forcing
Gradle and Turborepo to know about each other is the kind of complexity this
project exists to avoid. The only thing crossing the boundary is the OpenAPI
spec.

---

## 2. The contract is the architecture

The single most load-bearing decision in the repo: **the backend's OpenAPI spec
is the source of truth for the FE/BE boundary** (ADR-0004).

```
Ktor routes + kotlinx.serialization DTOs
        │  (emit)
        ▼
   openapi.json
        │  (codegen)
        ▼
packages/api-client  ──►  storefront, admin
   (TS types + React Query hooks)
```

- The frontends **never** hand-write types that mirror backend DTOs. They import
  from `@ethereal-nature/api-client`.
- A contract change is a backend change that regenerates the client. The
  frontends find out at compile time, not in production.
- Neither frontend knows Kotlin exists, and neither knows whether a given
  context is in-process or a separate service. That ignorance is the point — it
  is what lets the backend scale out later without touching the frontends.

---

## 3. Frontend architecture

### 3.1 Framework

**TanStack Start for both apps** (ADR-0002). Storefront runs with SSR/prerender
for crawlable product pages and fast first paint; admin runs as an authenticated
SPA with no SSR payoff. Same router, same conventions, same mental model — the
difference between the apps is *what they render and which routes need SSR*, not
two different runtimes.

TanStack Router's typed, validated **search params** are treated as first-class
state: catalog filters, pagination, sort, and tabs live in the URL with
compile-time safety, not in hand-synced `useState`.

> Version hygiene: pin `@tanstack/*` packages to exact versions and treat bumps
> as planned work. Do not float on broad ranges.

### 3.2 Styling

**Tailwind for both apps**, with headless primitives (shadcn/ui or Radix) for
accessible components and **TanStack Table** for admin data grids (ADR-0003).
No MUI — one styling model and one design-token source, shared through
`packages/ui`. The admin rebuilds the few things MUI X DataGrid gives free; at
this scope that is acceptable and keeps the UI layer coherent.

### 3.3 Feature/slice structure (soft DDD on the FE)

Each app is organised by feature slice, not by technical layer:

```
/features
  /catalog        domain (pure derivations), use-case hooks, components
  /cart
  /checkout
  /account
  /products       (admin)
  /orders         (admin)
```

Per slice: pure domain/derivation functions, use-case-scoped React Query hooks,
local UI state. No global "components / hooks / utils" dumping grounds.

### 3.4 State ownership (settled — ADR-0008)

| State kind                  | Owner          | Examples                                   |
|-----------------------------|----------------|--------------------------------------------|
| Server state                | React Query    | catalog, product detail, orders, profile   |
| Client-only ephemera        | Zustand        | cart drawer open, filter panel, wizard step |
| Guest (pre-auth) cart       | Zustand (persisted) | line items before login                |
| Dependency-injected values  | React Context  | auth session, theme, config                |

Hard rules:

- The React Query cache **is** the state for anything from the backend. Do not
  mirror server data into Zustand.
- Context is for dependency injection, not high-frequency state. The cart never
  lives in Context (re-render storms).
- URL-derivable state (filters, pagination) lives in search params, not in a
  store.

---

## 4. Backend architecture

### 4.1 Ktor, and what we assemble

Ktor is unopinionated. Spring Boot's starters did a lot of invisible work; here
that work is explicit (ADR-0005). The mapping:

| Spring gave us            | We assemble                                      |
|---------------------------|--------------------------------------------------|
| `data-jpa`                | Exposed (DSL flavor, not DAO) + hand-written mappers |
| `starter-security` + JWT  | Ktor `Authentication` plugin + route-level role guards |
| Bean DI / scanning        | Koin (lightweight) or manual constructor wiring  |
| `@Valid`                  | Domain constructors (invalid-by-construction VOs) + konform at the edge |
| `@Transactional`          | Explicit `transaction { }`, owned by the use-case layer |
| Jackson autoconfig        | kotlinx.serialization (`@Serializable` DTOs)     |
| `@ControllerAdvice`       | `StatusPages` plugin — one domain-error → HTTP map |
| Datasource + pooling      | HikariCP wired by hand                           |
| Auto-migrations           | Flyway, installed and triggered explicitly       |
| `application.properties`  | HOCON `application.conf`, explicit `install`s    |

This is more plumbing than Spring required — roughly a day or two of wiring —
and that is the accepted trade. Every piece is visible and swappable.

### 4.2 Bounded contexts

Four contexts, each internally layered:

```
/identity     users, roles, credentials, auth principal
/catalog      products, pricing, stock (authoritative)
/cart         mutable basket, merge logic
/ordering     immutable order snapshots
```

Start as a **single Gradle module with strict package boundaries**. Promote a
context to its own Gradle subproject only if/when you want the compiler to
enforce isolation (ADR-0006). Package discipline gets you 90% there on day one.

### 4.3 Internal layering (per context)

```
/domain          entities, value objects, sealed domain errors — NO framework imports
/application     use cases, repository PORTS (interfaces), transaction boundary
/infrastructure  Exposed tables, repository adapters, domain<->row mappers
/api             Ktor routes, request/response DTOs, DTO<->domain mapping
```

The dependency rule — non-negotiable:

```
api ──► application ──► domain ◄── infrastructure
```

- The domain is the center and imports nothing framework-y.
- **Ports are declared in the application layer; adapters live in
  infrastructure.** The cart's application layer says "I need something that can
  fetch a product's price, stock, and name" as an interface *it owns*
  (`ProductCatalogPort` — one port per consuming context, returning one atomic
  snapshot; see ADR-0009); infrastructure provides the implementation.
- The transaction boundary lives in the **use-case layer** — never in a
  repository, never in a route. One use case = one transaction.

### 4.4 Cross-context communication

A context **never** reads another context's tables. `cart` and `ordering`
need pricing and stock from `catalog`, so each defines its own
`ProductCatalogPort` and is handed an adapter that calls catalog's application
service (`GetProductsByIds`, `DecrementStock`).

At single-module scale the adapter is an in-process call. The *seam* is real, so
when catalog becomes its own service, only the adapter implementation changes.

---

## 5. The cart → login → order flow

This flow touches the contract, the cross-context seam, and a real domain
decision, so it is specified explicitly (ADR-0007).

### Guest phase
The guest cart is **client-side only** (Zustand, persisted). No anonymous
server carts — that would mean cookie identity and orphan-cart cleanup we don't
want. A guest line is `{ productId, quantity, priceSnapshot }`, where the
snapshot is **for display only**.

### The iron rule
**The server never trusts a client-supplied price or total.** The client cart is
a list of *intents* (product + quantity). Authoritative price and stock are
recomputed server-side at merge and again at checkout. `priceSnapshot` exists
only so the UI can show "this price changed since you added it."

### Merge on login
The client posts its guest lines to `POST /cart/merge`. The core is a pure
domain function:

```
mergeCarts(guestLines, existingUserCart, catalogSnapshot) -> MergeResult
```

`MergeResult` returns the merged cart **plus an adjustments report**: items
dropped (now out of stock), quantities clamped to availability, and price
changes vs. the guest snapshot. The frontend surfaces "2 items were updated"
instead of silently mutating the basket. On success, React Query replaces the
cart query with server truth and the Zustand guest cart is cleared.

Decide deliberately:
- **Merge policy** for duplicate products: sum quantities, then clamp to stock.
- **Idempotency**: a double-fired merge must not double quantities; merging an
  empty guest cart is a no-op.

### Checkout: cart → order
Cart and order are **different aggregates**. The cart is mutable and cheap. The
order is an **immutable snapshot** taken at purchase, living in `ordering`:

```
placeOrder: priceCart(intents, catalogSnapshot) -> PricedCart, then decrement + write
```

This use case re-validates stock and price one final time, decrements stock, and
produces a frozen order — all in **one transaction** (stock-decrement +
order-write must be atomic). The cart is emptied afterward. Keeping order
separate is what lets cart behavior change freely without ever risking the
integrity of a historical purchase, and it is where a future `payments` context
plugs in.

### Deliberately deferred
- **Stock reservation at add-to-cart** (vs. decrement at checkout). Reserve-at-
  cart is more correct for real commerce but adds reservation-expiry machinery.
  We decrement at checkout for the demo.

---

## 6. Context map (one flow, end to end)

```
identity ──(principal)──► scopes whose cart/order is whose
catalog  ◄──(port: ProductCatalogPort)── cart
catalog  ◄──(port: ProductCatalogPort)── ordering
cart     ──(snapshot at checkout)──► ordering
                    │
                    ▼
              openapi.json ──► storefront, admin
```

Four contexts, clean seams, one contract. The frontends only ever see the
OpenAPI DTOs.
