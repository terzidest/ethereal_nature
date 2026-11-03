# Desktop redesign — implementation spec

> **STATUS: SKELETON.** To be filled in by the design session that owns the
> "Ethereal Nature Desktop Redesign" claude.ai artifact (a canvas artifact —
> its source is not readable from other sessions, so this file is the
> handoff). Replace every `TODO` with values **from the design source**, not
> approximations. Implementation happens in a separate session against this
> file; it maps sections to page-builder blocks (see the `add-block` skill).

## 1. Design tokens

- **Palette**: TODO — name: hex for every color used (brand greens, sand,
  ink, surfaces, accents). Note which existing Tailwind theme tokens
  (`brand-*`, `sand-*`, `ink`, `surface*`) they replace or extend.
- **Typography**: TODO — families (display/body), weights, the type scale
  actually used per role (h1/h2/body/eyebrow/caption), line heights.
- **Shape & elevation**: TODO — border radii (`rounded-tile`/`rounded-card`
  replacements?), shadows, borders.
- **Spacing rhythm**: TODO — section paddings, max content width, grid gaps.

## 2. Home page — section by section, in order

For each section: exact copy, layout notes (columns, alignment, breakpoints),
and asset needs. Current blocks: `hero`, `categoryTiles`, `productStrip`,
`valueProps`. The redesign adds `uspTicker` and `newsletter` (new blocks).

1. **Hero** — TODO: eyebrow/title/subtitle copy, CTA labels + targets,
   artwork treatment (keep ProductArt grid? new art?).
2. **USP ticker** (NEW block) — TODO: items, separator style, motion spec
   (speed, pause-on-hover, reduced-motion behavior).
3. **Category tiles** — TODO: heading ("Four quiet corners of the garden"?),
   per-tile copy, tile art/hover treatment.
4. **New arrivals (productStrip)** — TODO: heading, card restyle notes.
5. **Value band (valueProps)** — TODO: heading(s) ("Chosen slowly, Shipped
   simply"?), items, layout.
6. **Newsletter** (NEW block) — TODO: heading ("Hear when the next batch is
   ready"?), input + button copy, success/error states, where submissions go
   (new backend capability? out of scope note?).

## 3. Other screens

- **Header / footer**: TODO — nav items, styling changes.
- **Catalog / product / cart / checkout**: TODO — per screen: what changes
  vs. today, or explicitly "unchanged".
- **Brand art** (logo & mark, category icons + micro-motion, herbarium
  plates): TODO — export as SVG into `packages/ui` assets? List each asset
  and its intended usage.

## 4. Motion & effects

TODO — the effects library boards: which effects apply to which components,
durations/easings, and the `prefers-reduced-motion` story.

## 5. Out of scope / later

TODO — anything shown in the boards that is deliberately not part of the
first implementation pass.
