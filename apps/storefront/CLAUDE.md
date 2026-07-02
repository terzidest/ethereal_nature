# CLAUDE.md — storefront (TanStack Start, SSR)

Rules specific to `apps/storefront`. Root `CLAUDE.md` and `ARCHITECTURE.md`
still apply; this file adds the public-store specifics.

## What this app is

The public, SEO-critical e-shop. Runs TanStack Start with **SSR/prerender** so
product and catalog pages are crawlable and fast on first paint. Browsing is
anonymous; only account and checkout require auth.

## Rendering rules

- **Catalog and product pages render server-side** (SSR or prerender). They must
  ship real HTML with title, meta description, and OG tags derived from product
  data — not a client-only shell.
- Data for SSR routes is fetched in **route loaders**, hydrated into React Query
  on the client. Do not fetch catalog data in a `useEffect`.
- Account, cart, and checkout are client-interactive; SSR them only as far as the
  shell, since they're behind auth or device-local.
- Keep `priceSnapshot` and any money formatting consistent between server and
  client render to avoid hydration mismatches.

## Search params are state

Catalog filters, pagination, sort, and category tabs live in **TanStack Router
typed search params**, not `useState`. They must be:
- validated with a schema at the route boundary,
- shareable/bookmarkable (a pasted URL reproduces the exact view),
- the single source of truth the catalog query reads from.

## The guest cart (this app owns it)

- The guest cart lives in **Zustand, persisted** (localStorage). It is the only
  place a pre-auth cart exists — never mint a server-side anonymous cart.
- A line is an **intent**: `{ productId, quantity, priceSnapshot }`. The snapshot
  is **display-only** — used solely to show "price changed since you added this."
- **Never compute or trust a cart total on the client for anything
  authoritative.** Display math is fine; the server is the source of truth for
  money at merge and checkout.

## Merge on login (this app drives it)

- On successful auth, POST the guest lines to `/cart/merge`.
- The response is the canonical server cart **plus an adjustments report**
  (items dropped as out-of-stock, quantities clamped, prices changed). Surface
  these to the user ("2 items were updated") — do not silently swap the basket.
- On success: replace the cart query with server truth, then clear the Zustand
  guest cart. Treat a re-fired merge as harmless (the server is idempotent).

## State ownership (storefront specifics)

| State                     | Owner               |
|---------------------------|---------------------|
| catalog, product, profile, orders | React Query  |
| guest cart                | Zustand (persisted) |
| authenticated cart        | React Query (server truth) |
| cart drawer, filter UI, checkout step | Zustand |
| catalog filters/sort/page | URL search params   |
| auth session, theme       | Context             |

## Feature slices

```
/features
  /catalog    listing, detail, filters (search-param driven)
  /cart       drawer, line items, guest store, merge call
  /checkout   multi-step flow, final server revalidation surfacing
  /account    profile, order history (read-only)
```

Pure derivations (e.g. display subtotal, "price changed" flags) are pure
functions in the slice. No global util bucket.

## Do not, without asking

- Hand-write types that mirror backend DTOs — import from `@ethereal-nature/api-client`.
- Trust a client-supplied price/total as authoritative.
- Move catalog data fetching out of loaders into ad-hoc effects.
- Add a second data-fetching or routing library.
