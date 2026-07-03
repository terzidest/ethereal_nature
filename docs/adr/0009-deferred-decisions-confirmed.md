# ADR-0009: Deferred cart/ordering decisions confirmed after implementation

**Status:** Accepted

## Context
ADR-0007 deliberately deferred two decisions to be revisited once the flows
existed in code (ROADMAP Phase 6): the duplicate-merge policy
(sum-then-clamp) and stock handling (reservation-at-add-to-cart vs
decrement-at-checkout). Both flows are now implemented and exercised by
tests and by the live system.

## Decision
**Both original choices stand.**

1. **Merge stays sum-then-clamp**, with idempotency provided by a
   client-minted `mergeId` stored on the cart (`carts.last_merge_id`).
   Replaying a merge returns the cart unchanged with an empty adjustments
   report. In practice the adjustments report (dropped / clamped /
   price-changed) gives users exactly the visibility the policy needs — no
   silent mutation, no surprise quantities.

2. **Stock stays decrement-at-checkout.** The race window this leaves
   (two carts holding the same last unit) is closed at the write: the
   decrement is guarded (`UPDATE … WHERE stock >= qty`) inside
   `placeOrder`'s single transaction, and a failed guard rejects the
   checkout with a 409 the user re-confirms. Reservation-at-cart would
   add expiry machinery (a sweeper, TTLs, reservation state on every
   read) to solve a problem the guarded decrement already handles at
   this scale.

## Consequences
- No code changes; this ADR records the review so the decisions read as
  chosen twice, not forgotten.
- A future `payments` context (which would hold stock during payment
  capture) is the natural trigger to reopen decision 2.

## Note on port naming
ARCHITECTURE §4.4 originally sketched two ports per consumer
(`ProductPricing`, `StockChecker`). The implementation uses **one port per
consuming context** (`ProductCatalogPort` in cart and in ordering) because
merge and checkout both need a single atomic snapshot of price+stock+name;
two ports would fetch the same rows twice or share hidden state.
ARCHITECTURE has been updated to match.
