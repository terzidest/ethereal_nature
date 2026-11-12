# Architecture Decision Records

Each ADR captures one settled decision and the reasoning behind it, so the *why*
survives after the *what* is obvious. ADRs are immutable once accepted — to
change a decision, write a new ADR that supersedes the old one.

| ADR | Decision | Status |
|-----|----------|--------|
| [0001](0001-polyglot-monorepo-split-build-graphs.md) | Polyglot monorepo with split TS/Gradle build graphs | Accepted |
| [0002](0002-tanstack-start-both-frontends.md) | TanStack Start for both frontends | Accepted |
| [0003](0003-tailwind-no-mui.md) | Tailwind + headless primitives, no MUI | Accepted |
| [0004](0004-openapi-contract-source-of-truth.md) | OpenAPI spec as the FE/BE contract | Accepted |
| [0005](0005-ktor-over-spring-boot.md) | Ktor over Spring Boot | Superseded by 0010 |
| [0006](0006-exposed-dsl-and-context-modules.md) | Exposed DSL + package-bounded contexts | Accepted |
| [0007](0007-cart-and-order-aggregates.md) | Cart as server aggregate, Order as immutable snapshot | Accepted |
| [0008](0008-frontend-state-ownership.md) | Frontend state ownership boundaries | Accepted |
| [0009](0009-deferred-decisions-confirmed.md) | Deferred cart/ordering decisions confirmed post-implementation | Accepted (decision 2 amended by 0012) |
| [0010](0010-fastify-migration-behind-frozen-contract.md) | Backend migrated Ktor → Fastify behind the frozen contract | Accepted |
| [0011](0011-content-context-blockprint.md) | Content context + blockprint page builder (opaque config, save = live) | Accepted |
| [0012](0012-unpaid-order-expiry.md) | Unpaid orders expire and give their stock back | Accepted |
