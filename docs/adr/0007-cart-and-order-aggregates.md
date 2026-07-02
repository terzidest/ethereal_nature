# ADR-0007: Cart as server aggregate, Order as immutable snapshot

**Status:** Accepted

## Context
A guest builds a cart before logging in; on login it must merge with any existing
cart; at checkout it becomes a purchase. Client-supplied prices cannot be
trusted. Cart is mutable and frequently changing; a purchase must be a stable
historical record.

## Decision
- Guest cart is **client-side only** (Zustand, persisted); lines are intents
  (`productId`, `quantity`) plus a display-only `priceSnapshot`.
- The **server never trusts client price/total/stock**; it recomputes on merge
  and checkout.
- `POST /cart/merge` runs a pure `mergeCarts(...)` returning the merged cart +
  an adjustments report (dropped, clamped, price-changed). Merge sums duplicates
  then clamps to stock, and is idempotent.
- **Cart and Order are separate aggregates.** `placeOrder(...)` re-validates,
  decrements stock, and writes an **immutable** order in one atomic transaction.
  Orders are never mutated.

## Consequences
- Cart behavior can change without endangering historical orders.
- `ordering` is the natural insertion point for a future `payments` context.
- Stock reservation at add-to-cart is deferred (decrement-at-checkout for now),
  trading strict correctness for less reservation-expiry machinery.
