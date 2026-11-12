# ADR-0012: Unpaid orders expire and give their stock back

**Status:** Accepted. Amends ADR-0009 decision 2.

## Context

ADR-0009 kept stock as decrement-at-checkout and named a payments context
as the trigger to revisit that. Payments now exists, and the gap is real:
orders only ever moved forward (`PLACED → PAID → PACKED → SHIPPED`).
Nothing cancelled an order or returned stock, so an order that was placed
but never paid held its stock forever. On the live demo, abandoned
checkouts slowly drained products to "sold out".

A second, latent bug sat next to it. The payment webhook marked orders
paid by catching "invalid transition" as "already paid", which only held
while every non-`PLACED` status was at or past `PAID`.

## Decision

1. **Stock is still decremented at checkout.** Reservation-at-cart stays
   rejected for the reasons in ADR-0009. What changes is that a decrement
   can now be undone.
2. **`CANCELLED` is a terminal order status, reachable only from
   `PLACED`.** Cancelling returns every line's quantity to the catalog in
   the same transaction, through the ordering → catalog port. Order lines
   are never touched, so the order is still an immutable snapshot with a
   status.
3. **Every status change is compare-and-set**
   (`UPDATE … WHERE id = ? AND status = <expected>`). Whichever of a
   payment and a cancellation commits first wins; the other sees zero rows
   updated and fails as an invalid transition. Stock is restored only by
   the cancel that won, so it can never be returned twice.
4. **Unpaid orders expire.** A `PLACED` order older than
   `ORDER_PAYMENT_TIMEOUT_MINUTES` (default 30) is cancelled by a sweep
   that runs inside the server process once a minute. Each order is
   cancelled in its own transaction. Running several instances is safe
   because of (3). The sweep is started by `server.ts`, not `buildApp`, so
   tests drive it directly instead of racing a timer.
5. **Admins cancel through the existing status endpoint**
   (`POST /admin/orders/{id}/status` with `CANCELLED`). No new route.
6. **A payment that succeeds after cancellation is refused.** The webhook
   answers 409 `ORDER_NOT_PAYABLE` and its transaction, including the
   intent settle, rolls back. Creating a new intent for a cancelled order
   was already refused.
7. **Customers see the deadline.** `OrderResponse` gains an optional
   `paymentDueAtEpochSeconds`, present only while an order is `PLACED`,
   computed server-side from the same setting the sweep uses.

## Consequences

- Abandoned checkouts release their stock within about a minute of the
  payment window closing.
- The mock PSP makes (6) clean: the "provider" is told no and nothing is
  charged. A real PSP would already have captured the money, so a real
  integration must void or refund the provider-side payment when an order
  is cancelled. That belongs to the real-PSP work, not here.
- The in-process sweep is the smallest thing that works on one Railway
  instance. If the server ever runs as many short-lived instances, move it
  to a scheduled job. The use case does not change.
- No migration: `orders.status` is free text and
  `idx_orders_status (status, placed_at)` already serves the sweep query.
