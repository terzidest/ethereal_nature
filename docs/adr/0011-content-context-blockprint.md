# ADR-0011: Content context + blockprint page builder

**Status:** Accepted (implemented in PRs #11–#15, live 2026-11-02)

## Context

The home page was hardcoded JSX. We wanted (a) content-managed pages editable
from the admin, and (b) a first production use case for
[blockprint](https://www.npmjs.com/package/blockprint) (our own npm library:
typed, config-driven block renderer, schema validation at the boundary).

## Decision

A sixth bounded context, **`content`**, owning a `pages` table
(`slug` PK, `config` jsonb, `updated_at`). A config is a flat array of
`{ type, props?, id? }` entries — blockprint's shape, no nesting.

The decisions a future session would otherwise re-litigate:

1. **The config is opaque in the contract.** `config` is `{}` (→ `unknown`)
   in the OpenAPI spec. The server validates **structure only** via the
   React-free `blockprint/config` (`parseConfig`, mapped `ConfigError` →
   `DomainValidationError` → 400). Per-block prop validation happens at
   render time in the storefront registry — the config is untrusted by
   design; that's the library's thesis, and it keeps block evolution out of
   the FE/BE contract entirely.
2. **Save = live.** No draft/publish workflow in v1. `PUT
   /admin/pages/{slug}` (ADMIN) replaces the config immediately. A draft
   state is the obvious v2 if editing grows beyond one trusted admin.
3. **Pages are created by migration only.** PUT on an unknown slug is 404,
   not upsert. Arbitrary page creation is deliberate future scope.
4. **Seed ↔ registry consistency is CI-enforced.** The V9 seed reproduces
   the previously hardcoded home verbatim (the storefront switch was a
   visual no-op); `registry.test.ts` parses the migration's JSON against
   every registered schema, so non-additive schema changes fail CI instead
   of silently dropping live sections (prod fallback renders null).
5. **Admin editor duplicates prop shapes (v1).** The admin can't import the
   storefront registry (it would pull in the components), so it mirrors the
   zod schemas as local interfaces + normalizers. Accepted at 4 blocks;
   the exit is a shared `blocks-contract` package of schemas (blockprint
   0.2.0's `PropsFor`/`InputFor` exist for exactly this).
   > **v2 (2026-11-12): the exit landed.** `@ethereal-nature/blocks-contract`
   > holds the schemas + a blockprint 0.3.0 manifest (`defineBlock`: label,
   > defaults, summary); the storefront joins components via
   > `createRegistry(manifest, components)`, the admin imports the manifest
   > and its `blocks.ts` is gone. Leniency is now **strict, entry-level**:
   > an editor entry whose props fail the schema is edited from the block's
   > defaults (the old normalizers recovered per field); storefront
   > semantics are unchanged. The server stays structure-only and must not
   > import the contract package (raw-TS workspace package; the server's
   > NodeNext build and Docker prune can't consume it).
6. **Viewer (demo) sees the editor read-only**; the server's role check is
   the boundary, as everywhere else.

## Consequences

- Adding/altering blocks never touches the contract or the server — see the
  `add-block` skill for the recipe and rollout order.
- Home's first paint depends on the backend (it already did via product
  data); a structurally-valid-but-wrong config degrades to skipped sections
  in prod, bounded by write-side structural validation + the seed test.
- blockprint 0.2.0 ships fixes discovered by this integration (ESM dist,
  `blockprint/config` subpath, editor types) — the findings-log loop between
  this repo and the library worked and is worth repeating.
