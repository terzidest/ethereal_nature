# Roadmap

Phased so each step is a vertical slice with a clear exit criterion and an
explicit "not in this phase" boundary. The ordering is contract-first, then read
paths before write paths, so the riskier domain logic (cart merge, order
placement) lands on top of a proven contract pipeline.

A phase is **done** only when its exit criteria pass *and* the OpenAPI client has
been regenerated to match.

---

## Phase 0 — Skeleton & contract pipeline

**Goal:** the monorepo runs end to end with the contract pipeline working, on a
trivial endpoint.

Scope:
- pnpm workspace + Turborepo; `packages/config` (eslint/ts/tailwind presets),
  `packages/ui` and `packages/api-client` scaffolded.
- Gradle backend stub: Ktor app, HikariCP + Postgres connection, Flyway wired,
  one `GET /health` route, kotlinx.serialization, StatusPages, OpenAPI emission.
- Codegen: `openapi.json` → `packages/api-client` (types + a React Query hook for
  `/health`).
- Both apps boot: storefront (SSR) and admin (SPA) each render a page that calls
  the generated health hook.
- CI: two jobs (Turborepo pipeline; `./gradlew check`).

**Exit:** `pnpm dev` runs both frontends, `./gradlew run` runs the backend, and
the health hook in `api-client` was generated (not hand-written) and works in
both apps.

**Not in this phase:** any domain logic, auth, persistence beyond the health
check.

---

## Phase 1 — Catalog read path

**Goal:** browse the catalog end to end, with SEO-correct product pages.

Scope:
- `catalog` context, all four layers. Domain: `Product`, money/stock value
  objects. Exposed tables + mappers; Flyway migration; seed data.
- `GET /products`, `GET /products/{id}` with server-side pagination/filtering.
  Regenerate `api-client`.
- Storefront: catalog listing (filters/sort/page in search params) + product
  detail, both **SSR/prerendered** with title/meta/OG from product data, data via
  route loaders hydrated into React Query.
- Admin: products list as a read-only TanStack Table (table state in search
  params).

**Exit:** a product page returns real crawlable HTML; catalog filters are
shareable via URL; admin lists products from the same endpoints.

**Not in this phase:** auth, cart, any writes.

---

## Phase 2 — Identity & auth

**Goal:** users can register/log in; admin is gated.

Scope:
- `identity` context: `User`, `Role` (`CUSTOMER`/`ADMIN`), credential VOs.
- Ktor `Authentication` (JWT), register/login endpoints, route-level role
  guards. Regenerate `api-client`.
- Storefront: account shell, login/register, session in Context.
- Admin: whole app behind auth + `ADMIN` role gate (server-enforced; client gate
  is UX only).

**Exit:** login works in both apps; a non-admin cannot reach admin routes; the
backend rejects unauthorized calls independent of UI state.

**Not in this phase:** cart, orders, profile editing beyond what login needs.

---

## Phase 3 — Cart & merge-on-login

**Goal:** a guest builds a cart that correctly merges into a server cart on
login.

Scope:
- Storefront guest cart in Zustand (persisted); lines as intents with
  display-only `priceSnapshot`.
- `cart` context server-side; `ProductPricing`/`StockChecker` ports with
  in-process adapters onto `catalog`.
- `POST /cart/merge` running pure `mergeCarts(...)` → merged cart + adjustments
  report (dropped / clamped / price-changed); sum-then-clamp duplicate policy;
  idempotent. Regenerate `api-client`.
- Storefront surfaces the adjustments report; on success replaces cart query with
  server truth and clears the guest store.

**Exit:** add items as guest, log in, see them merged with any adjustments
surfaced explicitly; price/stock recomputed server-side; re-firing merge is
harmless.

**Not in this phase:** checkout, order creation, payments.

---

## Phase 4 — Checkout → order (write path)

**Goal:** a cart becomes an immutable order, atomically.

Scope:
- `ordering` context; `Order` as an immutable snapshot aggregate.
- `placeOrder(...)` use case: final stock/price re-validation, stock decrement,
  immutable order write — **one atomic transaction**. Regenerate `api-client`.
- Storefront: checkout flow that surfaces any final-revalidation changes before
  confirming; order history (read-only) on the account page.
- Admin: orders list (table) + read-only detail + **status transitions only**
  (e.g. paid → packed → shipped). No order field is ever edited.

**Exit:** place an order; stock decrements in the same transaction; the order is
frozen; admin can advance fulfillment status but cannot edit order contents.

**Not in this phase:** product CRUD from admin, refunds/payments,
reservation-at-cart.

---

## Phase 5 — Admin product management

**Goal:** admin owns the catalog lifecycle.

Scope:
- Product create / edit / archive; stock and price management.
- React Query mutations with query-key invalidation (optimistic only where
  deliberate, with rollback). Server validation errors surfaced inline on forms.

**Exit:** admin can create, edit, and archive products; price changes never alter
existing orders (verified against a prior order's snapshot).

**Not in this phase:** bulk import, media pipeline, audit log.

---

## Phase 6 — Hardening (optional polish)

**Goal:** make it portfolio-grade and revisit deferred calls.

Scope:
- Unit tests on pure domain functions (`mergeCarts`, `placeOrder`, derivations) —
  no mocks needed.
- Loading skeletons, empty states, error boundaries across both apps.
- Revisit the two deliberately-deferred decisions (ADR-0007): duplicate-merge
  policy and stock reservation-at-cart vs decrement-at-checkout. Write a new ADR
  if either changes.

**Exit:** domain logic covered by fast tests; both apps handle loading/empty/
error states cleanly.

---

## Sequencing notes

- **Contract before consumers, always.** Every phase ends by regenerating
  `api-client`; the frontends only build against generated types.
- **Read before write.** Catalog (P1) proves the full pipeline before the risky
  write logic (cart merge P3, order placement P4) is attempted.
- **One context per phase where possible** keeps each step a clean vertical
  slice and minimizes cross-context churn.
- Phases 0–4 are the demonstrable core; 5–6 are depth. The project is *exitable*
  at the end of Phase 4 — it's a working e-shop.
