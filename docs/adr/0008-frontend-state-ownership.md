# ADR-0008: Frontend state ownership boundaries

**Status:** Accepted

## Context
React Query, Zustand, and Context all manage "state" but for different kinds.
Blurring them causes duplicated server data, re-render storms, and state that
should be in the URL hiding in stores.

## Decision
- **Server state → React Query.** The cache is the state for anything from the
  backend; never mirrored into Zustand.
- **Client-only ephemera → Zustand** (cart drawer, filter panel, wizard step),
  plus the persisted guest cart.
- **DI values → Context** (auth session, theme, config) — not high-frequency
  state; the cart is never in Context.
- **URL-derivable state → TanStack Router search params** (filters, pagination,
  sort, tabs).

## Consequences
- One obvious home for each kind of state; reviews can enforce it mechanically.
- Search-param state is shareable/bookmarkable and type-safe by default.
