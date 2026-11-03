---
name: add-block
description: Add a new content block type to the blockprint-powered page builder (storefront block + schema, registry, admin editor form, rollout order). Use when adding or changing home-page sections (e.g. uspTicker, newsletter) or any block-config work.
---

# Add a block to the page builder

Pages are stored as block configs (jsonb in `pages`, served by the `content`
context) and rendered by [blockprint](https://www.npmjs.com/package/blockprint)
on the storefront. A block = component + zod schema registered under a type
string. Configs are untrusted by design: the registry schema at render time is
the trust boundary; the server validates structure only (`blockprint/config`).

## Steps

1. **Storefront** (`apps/storefront/src/features/pages/`):
   - `blocks/<Name>.tsx`: the component + exported zod schema. Props are
     `z.output<typeof schema>` (defaults applied). If the block fetches data,
     export a **pure query builder** too (see `ProductStrip.productStripQuery`)
     and wire it into the loader's config-driven prefetch in
     `routes/index.tsx` so SSR and client share query keys.
   - `registry.ts(x)`: add `{ component, schema }` under the new type key and
     the schema to `blockSchemas`.
2. **Admin** (`apps/admin/src/features/pages/`):
   - `blocks.ts`: prop interface mirroring the storefront schema (v1 accepts
     this duplication), plus `label`, `defaults`, `summary`, and a `normalize`
     that defaults missing fields from untrusted props.
   - `components/BlockEditors.tsx`: the form; add the case to `BlockEditor`.
3. **Tests**: the seed↔registry test
   (`apps/storefront/src/features/pages/registry.test.ts`) parses the V9 seed
   SQL against every registered schema — it fails if a schema change breaks
   stored configs. Run the full gate (see verify-and-ship).

## Rules

- **Schemas evolve additively**: new props must be `.optional()` or
  `.default(…)`, or every stored config with the old shape falls back to
  nothing in prod (blockprint's prod fallback renders null, silently).
- **Rollout order**: deploy the storefront (knows the new block) BEFORE saving
  configs that use it. An older storefront renders unknown types via fallback;
  an older admin shows them as a preserved "Unknown block" card — nothing
  breaks, but the section won't render until the storefront deploy lands.
- No contract change needed: `config` is opaque (`{}` → `unknown`) in the
  OpenAPI spec on purpose.
- Changing a block's **type string** is a breaking rename: migrate stored
  configs (new migration updating the jsonb) or register both keys.
