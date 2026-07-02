# ADR-0005: Ktor over Spring Boot

**Status:** Accepted

## Context
The previous backend was Spring Boot (Java) — Data JPA, Security, validation,
all via starters. The rebuild targets Kotlin and a clean, explicit architecture.
Spring would ship faster but hides its wiring; the project's goals are
Kotlin fluency and a legible, framework-light domain.

## Decision
**Ktor.** Accept that we assemble by hand what Spring's starters provided:
Exposed for persistence, the Ktor Authentication plugin + route guards for
security, Koin (or manual) for DI, konform + domain constructors for validation,
explicit `transaction { }` boundaries, kotlinx.serialization, StatusPages for
error mapping, HikariCP, and Flyway.

## Consequences
- Roughly a day or two more plumbing than Spring required, up front.
- Every piece is visible and swappable; no filter-chain or autoconfig mysteries.
- Kotlin's sealed classes, data classes, and null-safety reward the pure-domain
  style more than the prior Java backend did.
- Wrong choice if the goal were shipping CRUD fastest; right for this project.
