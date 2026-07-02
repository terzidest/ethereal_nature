# ADR-0003: Tailwind + headless primitives, no MUI

**Status:** Accepted

## Context
Storefront wants a bespoke brand identity (MUI fights this — everything reads as
Material). MUI was only ever a candidate for the admin, justified by the X
DataGrid. But mixing MUI (admin) and Tailwind (storefront) fragments the shared
UI layer and undercuts the monorepo's shared design tokens.

## Decision
**Tailwind for both apps**, with headless primitives (shadcn/ui or Radix) for
accessible components and **TanStack Table** for admin data grids. No MUI.

## Consequences
- One styling model, one design-token source, a genuinely shareable
  `packages/ui`.
- The admin rebuilds a few things MUI X DataGrid provides free (advanced
  filters, column pinning). Acceptable at this scope; TanStack Table covers the
  common cases and its ergonomics match React Query.
