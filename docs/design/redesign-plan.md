# Desktop redesign — implementation plan

Source of truth for the look: the "Ethereal Nature Desktop Redesign" claude.ai
canvas — desktop boards (Home, Catalog, Product detail, Cart, Checkout → Pay →
Confirmation, Effects library, Brand art) and a "Mobile · 390" row with the
same five screens at phone width. This file maps what those boards show onto
the system as it exists on `main` and splits the work into frontend (FE),
backend (BE) and back-office/admin (BO). Values for tokens and copy are in
`redesign-spec.md`; this file is the *what* and *in which order*.

Last renewed 2026-11-10: mobile boards exist, product photos are hosted
(§4.2), all decisions in §6 are closed.

Guiding rule from `CLAUDE.md`: **default to less.** Where a board implies a
capability, the first answer is "can the storefront derive it from what the
API already returns?" Only then a contract change.

## 1. What already exists (no new work beyond restyling)

The boards lean on a lot that the system already does:

| Board feature | Already backed by |
|---|---|
| Category chips, search box, sort (Newest / Price ↑ / Price ↓) | `GET /products?category&q&sort` |
| "Only N left" badges, stock meter, stepper max | `stock` on `ProductResponse` / `CartLineResponse` |
| Guest basket that comes with you on sign-in | `POST /cart/merge` + `AdjustmentsDto` |
| "We updated your basket to match the shelf" banner | merge `adjustments` (dropped / clamped / priceChanged); for a signed-in cart, `stock` + `available` on each line let the FE derive it |
| Checkout rejection ("your basket changed…") | `POST /orders` with `expectedTotalMinor` → rejection issues |
| Ethereal Pay, Pay / Decline, retry payment | mock PSP, `POST /payments/intents` (create-or-return open intent), signed webhook |
| Confirmation timeline PLACED → PAID → PACKED → SHIPPED | order status chain + admin "advance status" |
| Home sections hero / category tiles / new arrivals / value band | blockprint blocks `hero`, `categoryTiles`, `productStrip`, `valueProps` |

## 2. Frontend (storefront + `packages/ui`)

### 2.1 Foundations (first PR, unblocks everything)
- **Tokens**: rewrite `packages/ui/src/tokens.css` to the Daylight palette
  (bg, raised, sand, ink, heading, soft, brand/brandSoft/brandDeep, amber
  set, lines, per-category placeholder + icon colours, crystal accent),
  radii (pill, 28/22/14), shadows, motion tokens (`--ease-grow`, durations).
- **Night garden** (dark theme, D1): every colour token is one
  `light-dark(day, night)` value, so there is a single definition per token.
  `<html data-theme>` picks the scheme: `system` (default — follows
  `prefers-color-scheme`), `light` or `dark`. A switch in the header saves
  the choice in `localStorage`; a tiny inline script in `<head>` applies it
  before first paint (no flash, no server code, SSR output stays cacheable).
  The admin never sets `data-theme`, so it stays light.
- **Night garden fixes** found when checking the boards (all text contrast
  already passes, ≥5:1):
  - Botanical line art hard-codes its outline colour `#22402C`. On the dark
    background the stroke-only lines (hero veins, story bouquet, newsletter
    divider, footer sprig) disappear. Outline colour becomes a token
    (`lineInk`, already defined: `#2B7049` light / `#7DD3A0` dark).
  - Surfaces barely separate in dark: `sand` vs `bg` is 1.04:1 and `raised`
    vs `bg` 1.09:1, and drop shadows don't show on near-black. Lift `sand`
    and `raised` a step and give dark-mode cards a `lineStrong` border.
  - Token drift between boards (`glass` 0.66 vs 0.72, `auroraA` 0.25–0.32):
    one value each in `tokens.css`.
  - The shared packing photo is sunlit and very bright next to the dark
    panels; dim it slightly in dark (`filter: brightness(.9)`).
- **Fonts**: add JetBrains Mono via fontsource alongside Fraunces + Inter
  (same mechanism as today; still a new dependency → sign-off).
- **Motion primitives** in `packages/ui`: rise/stagger, aurora, glass nav,
  skeleton shimmer, spinner, rolling number, tilt, magnetic, shake. One
  global reduced-motion rule; entrance effects added after hydration so SSR
  output is visible.
- **Brand art**: export logo/mark, 4 category icons (+ small line glyphs),
  6 herbarium plates as React SVG components in `packages/ui`. These replace
  `ProductArt`/`LeafMark` decoration; `ProductArt` stays only as the
  missing-photo fallback.

### 2.2 Screens
- **Shell**: glass pill nav (search icon → `/products?q=`), theme switch,
  cart pill with badge, new footer. Below 768px the shell follows the mobile
  boards (§2.3).
- **Home**: restyle the four existing blocks; add `uspTicker` (values
  marquee) and `newsletter` blocks (see BE §3.4). New-arrivals carousel and
  "New" badge (needs `createdAt`, §3.1). Story section = `valueProps` with a
  heading and plate art.
- **Catalog**: per-category title/blurb (static copy keyed by the fixed
  category enum — no CMS yet), chips with counts (§3.1), skeletons while
  fetching, empty state, quick-add → cart drawer. Pagination stays (the
  board shows 15 items; the API pages at 12).
- **Product detail**: gallery (1 photo → no thumbnails, ≥2 → thumbnails in
  order; §3.1), buy panel with origin eyebrow, "incl. VAT", stock meter
  (fixed "low stock" threshold, e.g. ≤10, FE-only), accordion
  (description / origin & specs / shipping), packing band with **one shared
  photo for every product — `site/packing-band.webp` in the R2 bucket**, "Pairs well with" (§2.4).
- **Cart page**: step indicator, adjustment banner, lines with caps, undo
  toast on remove, "A little something under €10" add-ons (§3.1 price
  filter), sticky summary.
- **Checkout / Pay / Done**: Review step, Ethereal Pay page restyle,
  declined state, confirmation timeline. Short order id = first 8 chars of
  the UUID (FE formatting; drop the "EN-20419" variant from Brand art).
- **Not designed, restyle with tokens only**: login/register, account,
  orders list, order detail ("View order"), 404 (plate art exists).
- **Card → PDP shared transition**: TanStack Router view transitions; needs
  a stable key — product id works, slug URLs are optional (§3.1).

### 2.3 Mobile (from the "Mobile · 390" boards)
Built in the same PR as each screen — one responsive component, not a
second tree.
- **Top bar**: logo + theme switch only. **Bottom tab bar**: Home, Shop,
  raised Basket button with count, Search, Account.
- **Swipe rows** (scroll-snap, next card peeks): category chips with counts
  (sticky under the top bar), New arrivals, Pairs well with, cart add-ons.
- **Sheets from the bottom** replace the side drawer: basket, sort.
- **Sticky action bars replace the tab bar** on Product (stepper + "Add ·
  €x"), Basket (total + Continue) and Checkout review ("Place order · €x").
  No tab bar anywhere in the checkout flow.
- Checkout steps collapse to "Step n of 4" + a 4-segment progress line; the
  review item list collapses to one row and opens on a stock rejection.
- Hover effects are off on touch (tilt, magnetic, cursor spotlight); quick
  add is an always-visible + button; ambient glows are smaller/less blurred.

### 2.4 Derived in the FE (deliberately no backend)
- "Pairs well with": 2 from the same category + 2 from others, via two
  `GET /products` calls. Curated relations are a later BO feature.
- Blur-up loading: blur from the category placeholder colour instead of a
  stored LQIP.
- Cart "stock changed since last visit" for signed-in users: compare
  quantity vs `stock` on each line.
- Dispatch time, packaging copy, perks row: static copy for now.

## 3. Backend (`apps/server`) — contract-first (`contract-change` skill)

### 3.1 Catalog context (all small, one context, no new tables except images)
1. **Product gallery** — `product_images` table (`product_id`, `url`,
   `label`, `position`, optional focal point `focus_x/focus_y`).
   `ProductResponse.images[]`; keep `imageUrl` as "first image" so cart
   lines, order lines and OG tags don't change. Migration copies existing
   `image_url` rows in. *Decision D2* — images table vs a JSONB column
   (table recommended: ordering + admin edits are cleaner).
2. **Specs** — nullable `origin`, `size`, `weight` and a short `summary`
   column (the board shows a one-line summary above the long description).
   Plain columns, not a generic attribute system.
3. **`createdAt` on `ProductResponse`** — the column exists; expose it for
   the "New" badge (FE: created in the last N days).
4. **Price filter** — `maxPriceMinor` (and `minPriceMinor`) on
   `GET /products`: serves the "Under €15" hero CTA and the "under €10"
   add-ons.
5. **Category counts** — either a `GET /categories` returning
   `{category, count}` or `facets` on the list response. Needed for chip
   counts, tile counts and "Browse all 15 products".
6. *Optional* — `GET /products/by-slug/{slug}` for readable URLs. Not
   required by any board.

### 3.2 Identity
- Checkout shows `[Customer name]` + initials. `users` has only email.
  *Decision D3* — show the email (no change) vs add an optional
  `display_name` (migration + register form + `UserResponse`).

### 3.3 Ordering / payments
- No changes. The boards have **no shipping address, shipping options,
  shipping cost, promo codes or tax lines** — total = subtotal, which is
  what the backend does today. Real addresses/shipping is a separate,
  larger project, out of scope here.

### 3.4 Newsletter — needs sign-off (doesn't fit any existing context)
The Home board has "Hear when the next batch is ready" with an email field.
Nothing in the system stores subscribers or sends email. *Decision D4*:
- **a. UI only** — ship the block disabled/"coming soon". Zero backend.
- **b. Own minimal capability** — a new `marketing` context (new bounded
  context → sign-off): `newsletter_subscribers(email, consent_at,
  source)`, `POST /newsletter/subscriptions` (idempotent, rate-limited),
  admin list + CSV export. No sending; export to a mail tool by hand.
- **c. Third-party** form (Buttondown/Mailchimp) — new external dependency,
  data leaves the system.
Recommendation: **a** now, **b** when there's a reason to collect emails.
Either way GDPR consent copy is needed before collecting anything.

### 3.5 Content context
- No server change: blockprint config is opaque to the server
  (ADR-0011). New blocks only touch the storefront and admin.

## 4. Back-office (`apps/admin`)

1. **Product form**: gallery editor — list of image URLs with label,
   reorder (up/down like the Pages editor), optional focal point; specs
   fields (origin, size, weight, summary). Live preview of the first
   image.
2. **Images (D5, done)** — photos live in a Cloudflare R2 bucket
   (`ethereal-nature-media`) served at `https://img.terzidest.com`:
   `products/<slug>.jpg` for the 15 seed products (+
   `products/amethyst-cluster-in-hand.jpg`), `site/packaging-shipping.jpg`
   and `site/packing-band.webp` for the store-wide shots. The system stays
   URL-based: the admin pastes a URL, nothing is uploaded through the app.
   A `V10` migration points the seed products at these URLs. Real uploads
   (presigned PUT into the same bucket) stay deferred — own ADR when media
   becomes real scope.
3. **Pages editor**: editors for `uspTicker` and `newsletter`, plus any
   new props on `hero` / `categoryTiles` / `productStrip` / `valueProps`
   (the admin mirrors block shapes — `add-block` skill).
4. **Orders**: already supports advancing to PACKED/SHIPPED, which the
   confirmation timeline relies on. Restyle only.
5. Only if D4 = b: newsletter subscribers list + export.
6. Later, not in this pass: curated "pairs well with" picker, site settings
   (dispatch time, packaging photo, perks), per-category copy in the CMS.

## 5. Order of work (one PR each, branched from fresh `main`)

| # | PR | Layer | Status |
|---|---|---|---|
| 1 | This plan + `redesign-spec.md` filled from the canvas | docs | done |
| 2 | `V10`: seed products use the R2 photo URLs | BE | done |
| 3 | Foundations — tokens (both themes), JetBrains Mono, theme switch, shell (nav, tab bar, footer) | FE | done |
| 4 | Catalog contract — `createdAt`, price filter, category counts | BE + client | done |
| 5 | Gallery + specs — migration, DTOs, admin product form | BE + BO | done |
| 6 | Motion primitives + brand art components in `packages/ui` | FE | done |
| 7 | Home — restyled blocks, `uspTicker`, `newsletter` (UI only), admin block editors | FE + BO | done |
| 8 | Catalog + basket sheet/drawer | FE | done |
| 9 | Product detail — gallery, specs, packing band, pairs-well-with | FE | in review |
| 10 | Basket page + checkout / pay / done | FE | |
| 11 | Leftover screens — auth, account, orders, 404 | FE | |
| 12 | Polish — view transitions, motion pass, reduced-motion + a11y audit | FE | |

3 and 4–5 can run in parallel (FE vs BE files don't overlap). 7–10 each
include the mobile layout for that screen.

## 6. Decisions (closed 2026-11-10)

| # | Question | Decided |
|---|---|---|
| D1 | Night garden: OS-driven or a toggle? | Switch in the header; defaults to the device setting |
| D2 | Gallery storage: table or JSONB? | Table |
| D3 | Customer name: show email or add `display_name`? | Show email |
| D4 | Newsletter: UI only, own context, or third-party? | UI only now |
| D5 | Images: URLs or real uploads? | URLs, hosted in R2 at `img.terzidest.com`; uploads deferred |
| D6 | JetBrains Mono: OK to add the fontsource package? | Yes |
| D7 | Mobile: design first or build a simple menu? | Designed — "Mobile · 390" boards on the canvas |
