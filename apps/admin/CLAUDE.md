# CLAUDE.md — admin (TanStack Start, SPA)

Rules specific to `apps/admin`. Root `CLAUDE.md` and `ARCHITECTURE.md` still
apply; this file adds the back-office specifics.

## What this app is

The authenticated back-office dashboard. No SEO, no public traffic — runs
TanStack Start in **SPA mode** (or Router-only). Every route is behind auth and
gated to the `ADMIN` role. CRUD- and table-heavy.

## Rendering & access rules

- No SSR payoff here — render client-side. Do not add prerender/metadata work.
- **Every route is auth-gated and role-gated to `ADMIN`.** Gating is enforced
  server-side by the backend; the client gate is UX only, never the security
  boundary. Assume the API rejects unauthorized calls regardless of UI state.
- A logged-in non-admin must never reach admin routes — redirect, don't render a
  disabled view.

## The immutability boundary — the rule that defines this app

- **Placed orders are immutable.** The admin can read orders and **transition
  their fulfillment status** (e.g. paid → packed → shipped) via dedicated
  status-transition endpoints. The admin can **never** edit a placed order's line
  items, prices, quantities, or totals. Those are a frozen historical record.
- If a task implies "edit the order," stop — it almost certainly means a status
  transition, a refund (a new event in a future `payments` context), or a new
  order. Surface the ambiguity rather than mutating order data.
- Products **are** mutable (price, stock, description, availability). Changing a
  product price never retroactively changes any existing order — that's the
  whole reason orders snapshot price at `placeOrder`.

## Tables

- Use **TanStack Table** for all data grids (products, orders). No MUI DataGrid.
- Table state — sort, pagination, page size, column filters — lives in **typed
  search params**, same discipline as the storefront. A pasted admin URL
  reproduces the exact grid view.
- Server-side pagination/filtering: the table reflects query params that drive
  the React Query call; do not fetch everything and filter client-side.

## Mutations

- All writes are **React Query mutations** against `@ethereal-nature/api-client`.
- On success, **invalidate the relevant query keys** rather than hand-patching
  cache, unless an optimistic update is deliberately warranted (e.g. a status
  toggle). If optimistic, roll back on error.
- Surface server validation errors (the domain errors mapped by StatusPages)
  inline on the form — don't swallow them into a generic toast.

## State ownership (admin specifics)

| State                          | Owner             |
|--------------------------------|-------------------|
| products, orders, lookups      | React Query       |
| table sort/page/filters        | URL search params |
| modal/drawer open, form draft  | Zustand (or local component state) |
| auth session, role, theme      | Context           |

Server data is never mirrored into Zustand.

## Feature slices

```
/features
  /products   list (table), create/edit forms, stock & price, archive
  /orders     list (table), detail (read-only), status transitions only
```

## Do not, without asking

- Edit, delete, or rewrite any field of a placed order.
- Treat the client role-gate as a security boundary.
- Hand-write backend-mirrored types — import from `@ethereal-nature/api-client`.
- Introduce MUI or a second table/data library.
- Fetch full datasets to filter/sort on the client.
