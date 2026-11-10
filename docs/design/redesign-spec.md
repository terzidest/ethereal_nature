# Redesign — implementation spec

Values taken from the "Ethereal Nature Desktop Redesign" claude.ai canvas
(desktop boards + the "Mobile · 390" row) on 2026-11-10. Where boards
disagreed, the value below is the one to build. What to build and in which
order: `redesign-plan.md`.

## 1. Design tokens

Two themes: **Daylight** (light) and **Night garden** (dark). Every colour
token has both values; in code each is one `light-dark(day, night)`.

### Colour

| Token | Daylight | Night garden | Use |
|---|---|---|---|
| `bg` | `#FAF8F2` | `#0A130F` | page |
| `raised` | `#FFFFFF` | `#17261E` | cards, inputs, sheets |
| `sand` | `#F2EEE3` | `#13211A` | bands, footer, ticker |
| `ink` | `#1E2B24` | `#E6EEE8` | body text |
| `heading` | `#173A28` | `#F1F6F2` | headings, strong labels |
| `soft` | `#56645B` | `#A3B4A9` | secondary text |
| `brand` | `#2B7049` | `#7DD3A0` | primary buttons, eyebrows, links |
| `brand-deep` | `#1F5637` | `#5FB884` | pressed / "added" state |
| `brand-soft` | `#E3F1E8` | `rgba(125,211,160,0.14)` | active pills, icon chips |
| `on-brand` | `#FFFFFF` | `#0A130F` | text on `brand` |
| `amber` | `#E8B04F` | `#F0BE68` | badges, stock meter, stars |
| `amber-wash` | `#FBF0DA` | `rgba(240,190,104,0.12)` | notice background |
| `amber-line` | `rgba(200,140,30,0.3)` | `rgba(240,190,104,0.3)` | notice border |
| `amber-text` | `#7A4F06` | `#F5CF8C` | notice text |
| `line` | `rgba(23,58,40,0.10)` | `rgba(220,240,228,0.10)` | hairlines |
| `line-strong` | `rgba(23,58,40,0.18)` | `rgba(220,240,228,0.18)` | input / outline borders |
| `glass` | `rgba(250,248,242,0.78)` | `rgba(14,24,19,0.72)` | nav, tab bar, sticky bars (with `blur(16px) saturate(1.4)`) |
| `scrim` | `rgba(12,26,18,0.72)` | `rgba(0,0,0,0.75)` | behind sheets/drawer (with `blur(4px)`) |
| `deep` | `#163A27` | `#12281C` | "How we work" panel (text on it is always `#EEF4EF`) |
| `skeleton` | `#EEE8DA` | `#16231C` | loading placeholders |
| `art-ink` | `#22402C` | `rgba(170,215,188,0.55)` | outlines of all botanical art |
| `crystal` | `#8A6CC0` | `#B59BE6` | crystal accent |
| `crystal-text` | `#6B4FA0` | `#C9B3F0` | crystal eyebrow text |
| `toast-bg` / `toast-fg` | `#173A28` / `#EEF4EF` | `#EEF4EF` / `#0A130F` | undo toast (inverted) |

Per category — photo placeholder (also the blur-up colour) and icon tint:

| Category | Placeholder day / night | Icon day / night |
|---|---|---|
| Oils | `#EFDDBE` / `#2A2216` | `#B0761F` / `#F0C27A` |
| Herbs | `#D3E3C8` / `#18261B` | `#3C6834` / `#9FD89A` |
| Crystals | `#E2D8EE` / `#221D2C` | `#6A4E96` / `#C7B3EE` |
| Teas | `#E8D6C2` / `#28201A` | `#9C5A3C` / `#E8A682` |

Ambient glows (blurred circles): green `rgba(122,196,148,0.40)` /
`rgba(60,160,105,0.30)`; warm `rgba(240,190,110,0.35)` /
`rgba(200,140,50,0.20)`; crystal pages `rgba(180,150,230,0.40)` /
`rgba(140,100,220,0.30)`; pay page `rgba(160,170,190,0.30)` /
`rgba(120,130,160,0.20)`.

Existing Tailwind tokens: `surface` → `bg`, `surface-raised` → `raised`,
`sand-100` → `sand`, `ink` → `ink`, `ink-soft` → `soft`, `amber-accent` →
`amber`. The `brand-50…900` scale stays for the admin and for not-yet-restyled
screens; new work uses the semantic names above.

### Shadows

| Token | Daylight | Night garden |
|---|---|---|
| `card` | `0 1px 2px rgba(23,58,40,0.06), 0 8px 24px rgba(23,58,40,0.08)` | `0 0 0 1px rgba(220,240,228,0.10), 0 12px 32px rgba(0,0,0,0.4)` |
| `lift` | `0 4px 8px rgba(23,58,40,0.08), 0 28px 60px rgba(23,58,40,0.18)` | `0 0 0 1px rgba(220,240,228,0.14), 0 30px 80px rgba(0,0,0,0.55)` |
| `nav` | `0 8px 32px rgba(23,58,40,0.08)` | `0 8px 32px rgba(0,0,0,0.35)` |
| `btn-glow` | `0 10px 30px rgba(43,112,73,0.35), inset 0 1px 0 rgba(255,255,255,0.2)` | `0 0 0 1px rgba(125,211,160,0.4), 0 10px 40px rgba(125,211,160,0.35)` |

Night garden shadows carry a 1px ring because drop shadows don't read on
near-black.

### Typography

- **Display**: Fraunces (variable, optical size). Headings weight 600; the
  emphasised words inside a heading are *italic, weight 400*
  ("Four quiet corners *of the garden.*").
- **Body**: Inter 400 / 500 / 600.
- **Mono**: JetBrains Mono 400 / 500 — eyebrows (11–12px, uppercase,
  letter-spacing 0.14em, `brand`), order codes, counters.

| Role | Desktop | Mobile |
|---|---|---|
| Hero h1 | 84px / 0.98 / -0.03em | 46px / 1.0 |
| Page h1 (catalog, basket, checkout) | 76px / 1.0 / -0.03em | 38px / 1.02 |
| Product h1 | 64px / 1.02 / -0.03em | 38px / 1.02 |
| Section h2 | 52px / 1.05 / -0.02em | 32px / 1.08 |
| Product name on card | 16px / 500 | 14–15px |
| Price on card | Fraunces 20px / 600 | 17–18px |
| Body | 17–19px / 1.6 | 15–16px / 1.6 |
| Eyebrow | mono 12px | mono 11px |

### Shape and layout

- Radii: pills `999px` (buttons, chips, nav, inputs); panels/bands `36px`
  (28px mobile); category tiles `28px` (22px); product photos `24px`
  (18–20px); cards `22px`; small tiles `14–16px`.
- Content max-width `1240px`, gutter `24px` (mobile `20px`). Narrow blocks:
  880 / 520 / 420px.
- Section rhythm: 80–120px vertical on desktop, 48–56px on mobile.
- Touch targets ≥ 44px. Buttons 52–56px tall.
- Breakpoints: ≥ 900px desktop layout; < 768px mobile layout (tab bar,
  sheets, swipe rows); between, the desktop layout with 2-column grids.

## 2. Home — sections in order

Blocks: `hero`, `uspTicker` (new), `categoryTiles`, `productStrip`,
`valueProps`, `newsletter` (new).

1. **Hero** — eyebrow "New season harvest · 15 small batches" (amber dot);
   h1 "Nature, bottled, dried & *crystallised.*"; sub "Essential oils, herbs,
   crystals and teas in small, honest batches — chosen slowly, shipped
   simply."; CTAs "Shop everything" (primary, → catalog) and "Under €15"
   (outline, → catalog with max price 1500); trust row "Sourced with care /
   Plastic-free post / Secure checkout". Right: botanical line-art collage
   (three plates) on a soft "sun" disc with a dashed ring, plus a rotating
   seal "SMALL BATCH · SOURCED WITH CARE ·". No product photos in the hero.
   Mobile: copy first, buttons stacked full-width, art scaled under it.
2. **USP ticker** — sand band, Fraunces italic 26px (20px mobile), amber
   star separators, loops in 38s: Steam-distilled oils · Whole dried herbs ·
   Hand-picked crystals · Loose-leaf teas · Plastic-free post · Small
   batches. Decorative (`aria-hidden`); stops under reduced motion.
3. **Category tiles** — eyebrow "01 — Shop by category"; h2 "Four quiet
   corners *of the garden.*"; link "Browse all N products →". Four tiles
   (count chip, illustrated icon, name, tagline): Essential oils —
   "Steam-distilled, single-origin"; Herbs — "Dried whole, small harvests";
   Crystals — "Hand-picked specimens"; Teas — "Loose leaf, honest blends".
   Desktop 4 across, 440px tall; mobile 2 × 2, 214px tall.
4. **New arrivals** — eyebrow "02 — Fresh from the drying racks"; h2 "New
   arrivals". Cards: 4:5 photo, optional badge ("New" / "Only N left"),
   category eyebrow, name, price, quick add. Desktop: 4 across with
   prev/next; mobile: swipe row, 232px cards, + button.
5. **How we work** — `deep` panel, art left (hand-tied bouquet, caption
   "Hand-tied with a silk ribbon · picked the slow way"), copy right:
   eyebrow "03 — How we work"; h2 "Chosen slowly. *Shipped simply.*"
   (emphasis in `#F0C27A`); 01 Sourced with care — "Every grower and cutter
   is someone we know by name."; 02 Small batches — "Short runs, fresh stock
   — nothing sits in a warehouse for years."; 03 Plastic-free post —
   "Recycled boxes, paper tape, no fillers." Mobile: art on top.
6. **Newsletter** — olive-sprig divider; eyebrow "Harvest notes"; h2 "Hear
   when the next batch *is ready.*"; "One short letter per harvest. No
   noise."; email field + "Subscribe". UI only for now (D4): the button is
   inert until a backend exists; no address is stored.

## 3. Other screens

- **Header** — floating glass pill: mark + wordmark, nav (Shop all, Oils,
  Herbs, Crystals, Teas), search icon, theme switch (moon in Daylight, sun
  in Night garden), Sign in / Account, Cart pill with count. Mobile: top bar
  with logo + theme switch only; bottom tab bar Home · Shop · raised Basket
  (count) · Search · Account.
- **Footer** — sand; mark + blurb "Small-batch essential oils, dried herbs,
  crystals and loose-leaf teas, sourced with care."; Shop links (4
  categories); Account links (Sign in, Orders, Cart); giant faint wordmark;
  "© Ethereal Nature" and "Demo store · mock payments only".
- **Catalog** — eyebrow "The shop · N products"; title + blurb per category:
  All "Everything *we grow.*" / "Essential oils, herbs, crystals and teas —
  every batch currently on the shelf."; Oils "Essential *oils.*" /
  "Steam-distilled and cold-pressed, single-origin."; Herbs "Dried *herbs.*"
  / "Dried whole from small harvests."; Crystals "Hand-picked *crystals.*" /
  "Specimens chosen one by one — every piece unique."; Teas "Loose-leaf
  *teas.*" / "Honest blends, no dust, no bags." Chips with glyph + count,
  search "Search products…", sort Newest / Price ↑ / Price ↓, 4-column grid
  (2 on mobile), skeletons while fetching, empty state "Nothing growing here
  yet." / "Try another word or clear the filters." / "Clear filters". Basket
  drawer (sheet on mobile): "Your basket · N items", lines with stepper,
  "Prices and stock are confirmed at checkout.", "Checkout"; empty "Your
  basket is resting" / "The herbs are a good place to start."
- **Product** — breadcrumb; gallery (1 photo: no thumbnails/dots; ≥ 2:
  thumbnails in order on desktop, swipe + dots + "1 / 2" on mobile); buy
  panel: eyebrow "Category · Origin", name with italic second word, price +
  "incl. VAT", summary, stock meter ("Low stock · N pieces left" when ≤ 10),
  stepper (1…stock), "Add to basket · €x" → "Added to basket", perks row;
  accordion Description / Origin & specs (Origin, Size, Weight) / Shipping
  (Packaging, Dispatch, `site/packaging-shipping.jpg`); packing band (copy
  on sand + `site/packing-band.webp`): eyebrow "Packed by hand", "Packed by
  hand, one order at a time.", "Every order leaves in a recycled kraft box,
  with a card naming what's inside."; "From the same shelf" / "Pairs well
  with" (4 products) / "All <category> →". Mobile: sticky buy bar replaces
  the tab bar.
- **Basket** — "Step 1 of 4 · N items"; h1 "Your *basket.*"; notice "We
  updated your basket to match the shelf." + detail line; lines (photo,
  category, name, "€x each", stepper, "Max N available" when capped, total,
  remove → toast "Removed <name>" / "Undo"); add-ons "A little something
  *under €10*" / "One-tap add"; summary (Items (n), Packaging: Plastic-free,
  Total, "Continue to checkout", "Sign in at the next step — your basket
  comes with you."); empty "Your basket is resting" / "Nothing in it yet.
  The herbs are a good place to start." / "Back to the shop".
- **Checkout** — Review: "Step 2 of 4 · Review"; h1 "One last *look.*";
  lines; Account card (customer email, D3); Payment card "Ethereal Pay" /
  "Demo provider — no real money moves."; total panel "Confirmed by the
  shop"; "Place order · €x" → "Placing order…"; rejection (`role="alert"`,
  shake) "Your basket changed while you were checking out — please review
  and confirm again." + what changed, changed quantity highlighted amber.
  Pay: "Step 3 of 4 · You're on the payment provider's page"; "Confirm your
  payment", order code, total, "Pay €x" / "Decline"; declined: "Payment
  declined" / "Nothing was charged. You can retry the payment from your
  order." / "Retry payment" / "Back to your order". Done: "Step 4 of 4 ·
  Order <first 8 chars of id>"; h1 "Thank you — *it's paid.*"; "Your order
  is paid and on its way through fulfilment. We'll pack it in a recycled
  kraft box with paper tape, and a sprig of lavender."; timeline Order
  placed / Payment received / Packed / Shipped; "View order" / "Keep
  browsing".
- **Not designed** (login, register, account, orders, order detail): keep
  the current layouts, restyled with the tokens. 404 uses the ginkgo plate
  with "This path grew over".
- **Brand art** → React SVG components in `packages/ui`: mark (line branch
  in a mint circle, works to 16px), wordmark; four illustrated category
  icons + four simple line glyphs (below 32px); six herbarium plates —
  lavender (oils, hero), eucalyptus (hero, footer), chamomile (teas, story),
  sage (herbs, empty basket), olive (dividers, newsletter), ginkgo (404, no
  results); parcel (order confirmation); bouquet (How we work). Outlines use
  `art-ink`. Photos are for products only — never hero, tiles or empty
  states.
- **Photo style** (for future product shots): warm window light from the
  left, one surface per category, one centred object with ~15% breathing
  room, props only from the product's own ingredient, 4:5 at ≥ 1000×1250,
  no readable label text.

## 4. Motion & effects

Tokens: ease `cubic-bezier(.2,.7,.2,1)`; quick 200–300ms; settle 450–900ms;
ambient loops 9–38s.

| Effect | Where | Spec |
|---|---|---|
| Glass nav / bars | every page | `blur(16px) saturate(1.4)` |
| Breathing aurora | hero, catalog, product (lilac on crystals), basket, checkout | blur 60px (40px mobile), 10s |
| Pollen motes | hero, confirmation | drift 9s |
| Staggered rise | copy, grids | 14–18px up, 80ms steps |
| Masked word reveal | hero headline | per word, 0.9s |
| Rotating seal | hero | 24s |
| Values marquee | home | 38s |
| Quick-add reveal | product cards (hover/focus; always visible on touch) | 0.3s |
| 3D tilt + sheen | product cards, product stage, related | ≤ 8–12°, pointer only |
| Cursor spotlight | category tiles, basket summary, checkout total | pointer only |
| Magnetic CTA | Shop everything, Add to basket, Continue, Place order | ≤ 12px, pointer only |
| Category micro-motion | tiles on hover | drop 1.8s, sway 2.4s, glint 2.2s, steam 2s |
| Blur-up photos | every product photo | from the category placeholder colour, ~1.1s |
| Paper skeletons | catalog while fetching | shimmer 1.2s |
| Basket drawer / sheet | on add | slide 0.45s + scrim |
| Rolling totals | drawer subtotal, basket, checkout total | 0.4s on change |
| Rejection shake | stock rejection, payment declined | 0.4s, `role="alert"` |
| Glow button + spinner | Place order, Pay | pending state |
| Check draw + ripple | confirmation | 0.6s |
| Card → product transition | card photo to product stage | View Transitions via TanStack Router |

Rules: animate only `transform` and `opacity`; content renders visible on
the server and entrance effects are added after hydration; under
`prefers-reduced-motion` ambient loops, tilt, magnet and parallax are off and
everything else is instant.

## 5. Out of scope for this redesign

- Storing newsletter addresses or sending email (D4).
- In-app image uploads (D5) — photos are pasted as URLs.
- Shipping addresses, shipping costs, promo codes, tax lines — not on any
  board; total = subtotal.
- Curated "pairs well with", site settings in the admin, per-category copy
  in the CMS.
- Journal/story pages and the "growing reading line" effect.
- Effects cut on the Effects board: curtain image reveal, fly-to-cart,
  dappled leaf light, paper grain.
