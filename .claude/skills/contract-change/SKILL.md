---
name: contract-change
description: Change the OpenAPI contract (add/modify endpoints or DTOs) — spec-first workflow, client regeneration, bijection gate, and the spec-editing gotchas. Use for any FE/BE boundary change.
---

# Contract change (spec-first)

The committed `packages/api-client/openapi.json` IS the contract AND the
Fastify runtime schema source (`apps/server/src/platform/contract.ts` derives
every route schema from it via `opSchema(path, method)`). Code matches spec,
never the reverse. Full rules: `apps/server/CLAUDE.md`.

## Steps

1. **Edit the spec** (`packages/api-client/openapi.json`) — add component
   schemas and operations matching the existing structure.
   - If scripting the edit with Python: `json.dump(..., ensure_ascii=False)`.
     The default escapes every em-dash/€ into `\uXXXX` and produces a huge
     noise diff.
   - **Property order matters**: hey-api generation is order-sensitive; keep
     ordering conventions consistent with neighboring schemas or unrelated
     generated files will churn.
2. **Server**: domain → use case → repository → route wired with
   `opSchema(...)`. New routes register in `app.ts`. Note: list endpoints
   drop the AJV querystring schema and hand-parse (Ktor-parity leniency).
3. **Bijection test**: `apps/server/test/contract-gate.test.ts` asserts
   `specOperations()` count — update the expected number. It fails until
   spec and registered routes agree 1:1; that's the point.
4. **Regenerate the client** against a running server:
   ```bash
   pnpm exec tsx src/server.ts   # from apps/server, on a free port via PORT=
   OPENAPI_URL=http://localhost:<port>/openapi.json pnpm --filter @ethereal-nature/api-client generate
   ```
   Never hand-edit `packages/api-client/src/generated/`.
5. Tests (inject-based, real Postgres) + full gate (see verify-and-ship).
   Spec edit and regenerated client ship **in the same PR**.

## Never

- Add `@fastify/swagger` or hand-write a route body/response schema.
- Mirror a backend DTO as a hand-written TS type in a frontend — import from
  `@ethereal-nature/api-client`.
- Mutate an already-applied migration to support the change — new `V<n>` file.
