# ADR-0002: TanStack Start for both frontends

**Status:** Accepted

## Context
Storefront needs SSR/SEO; admin is an authenticated SPA with no SSR payoff. The
alternatives were (a) Next.js storefront + Vite/React admin, or (b) one
framework for both. As of 2026, TanStack Start is stable (v1.x, broad adoption),
so "Next.js because it's the safe default" is a weak argument.

## Decision
**TanStack Start for both apps.** Storefront uses SSR/prerender; admin runs in
SPA mode. One router, one mental model. TanStack Router's typed/validated search
params are used as first-class state for filters, pagination, sort, and tabs.

## Consequences
- The two apps differ in *what they render and which routes need SSR*, not in
  runtime — strong consistency and shared conventions.
- Tight integration with React Query (already in the stack).
- Smaller ecosystem than Next.js; mitigated by pinning `@tanstack/*` to exact
  versions and treating bumps as planned work.
- We forgo Next's deeper plugin/example ecosystem; an acceptable trade for
  coherence and the typed-router benefits.
