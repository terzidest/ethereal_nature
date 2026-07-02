# ADR-0004: OpenAPI spec as the FE/BE contract

**Status:** Accepted

## Context
TS and Kotlin must share an API contract. Options: hand-write mirrored TS types
(simple, drifts), or generate from a single source. This seam is the boundary
between bounded contexts and the FE — getting it right is what makes the system
"scale" rather than just claim to.

## Decision
The **backend's OpenAPI spec is the source of truth.** Ktor +
kotlinx.serialization emit `openapi.json`; codegen produces TS types and React
Query hooks into `packages/api-client`. Frontends import only from there and
never hand-write backend-mirrored types.

## Consequences
- Contract changes originate in the backend and regenerate the client; the
  frontends discover breakage at compile time.
- The generated client is never hand-edited.
- Frontends stay ignorant of whether a context is in-process or a separate
  service — enabling later extraction without FE changes.
- Slight upfront cost wiring the OpenAPI emission + codegen pipeline.
