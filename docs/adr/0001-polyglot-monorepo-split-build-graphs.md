# ADR-0001: Polyglot monorepo with split TS/Gradle build graphs

**Status:** Accepted

## Context
The project is one e-shop with two TypeScript frontends and a Kotlin/Ktor
backend. Keeping them in one repo simplifies the contract workflow and atomic
cross-cutting changes. But TS tooling (pnpm/Turborepo) and Kotlin tooling
(Gradle) are different build systems with different graphs.

## Decision
Single repo, **two independent build graphs**. pnpm + Turborepo orchestrate the
TS workspace; Gradle owns the backend. They do not reference each other. The
only artifact crossing the boundary is the OpenAPI spec. Nx (or any unifying
orchestrator over both) is rejected.

## Consequences
- No single `build` command spans both stacks; CI runs the TS pipeline and the
  Gradle pipeline as separate jobs. Acceptable and clearer.
- Onboarding is per-stack, which matches how the work actually splits.
- Avoids the heavy polyglot-orchestrator complexity this project exists to not
  have.
