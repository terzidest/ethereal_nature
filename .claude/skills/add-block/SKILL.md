---
name: add-block
description: Add a new content block type to the blockprint-powered page builder (storefront block + schema, registry, admin editor form, rollout order). Use when adding or changing home-page sections (e.g. uspTicker, newsletter) or any block-config work.
---

# Add a block to the page builder

Pages are stored as block configs (jsonb in `pages`, served by the `content`
context) and rendered by [blockprint](https://www.npmjs.com/package/blockprint)
on the storefront. Block knowledge lives in ONE place —
`packages/blocks-contract` (`@ethereal-nature/blocks-contract`): the zod
schema plus a `defineBlock` manifest entry (label, defaults, summary). The
storefront joins components to the manifest; the admin builds its editor from
it. Configs are untrusted by design: the registry schema at render time is the
trust boundary; the server validates structure only (`blockprint/config`) and
must NOT import the contract package.

## Steps

1. **Contract** (`packages/blocks-contract/src/`):
   - `blocks/<name>.ts`: the zod schema, an exported `<Name>Props =
     z.output<…>` type, and `defineBlock({ schema, label, defaults, summary })`.
     Defaults must parse against the schema (`manifest.test.ts` enforces it).
   - `manifest.ts`: register the new entry; `index.ts`: export schema + props
     type.
2. **Storefront** (`apps/storefront/src/features/pages/`):
   - `blocks/<Name>.tsx`: the component, typed with the contract's props type.
     If the block fetches data, export a **pure query builder** too (see
     `ProductStrip.productStripQuery`) and wire it into the loader's
     config-driven prefetch in `routes/index.tsx` so SSR and client share
     query keys.
   - `registry.tsx`: add the component under the new type key in
     `createRegistry(manifest, { … })` — a missing or mismatched component is
     a compile error on that key.
3. **Admin** (`apps/admin/src/features/pages/`):
   - `components/BlockEditors.tsx`: the form; add the case to `BlockEditor`.
     Labels/defaults/summaries come from the manifest; untrusted props are
     normalized by `editor-values.ts` (strict: an entry that fails its schema
     is edited from the block's defaults).
4. **Tests**: the seed↔manifest test
   (`apps/storefront/src/features/pages/registry.test.ts`) runs blockprint's
   `validateConfig` over the V9/V12 seed SQL — it fails if a schema change
   breaks stored configs. Run the full gate (see verify-and-ship).

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
