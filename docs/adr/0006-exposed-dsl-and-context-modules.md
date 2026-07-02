# ADR-0006: Exposed DSL + package-bounded contexts

**Status:** Accepted

## Context
Ktor has no default ORM. Exposed offers a DAO (active-record) flavor and a DSL
(SQL-shaped) flavor. Separately: contexts could be Gradle subprojects (compiler-
enforced isolation) or packages within one module (discipline-enforced).

## Decision
**Exposed DSL**, with explicit domain<->row mappers — never the DAO flavor, which
reintroduces entity magic. Contexts (`identity`, `catalog`, `cart`, `ordering`)
start as **packages in a single Gradle module** with strict boundaries. Promote a
context to its own subproject only when compiler-enforced isolation is wanted.

## Consequences
- Persistence shape and domain shape can diverge freely.
- Mapping is manual boilerplate — accepted; it keeps the domain pure.
- Package discipline gets ~90% of the isolation benefit on day one without
  subproject ceremony; promotion later is mechanical.
