import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import type { Kysely } from 'kysely'
import { catalogAdapter, kyselyCartRepository } from './cart/infrastructure.js'
import { cartRoutes } from './cart/routes.js'
import { cartUseCases, type CartUseCases } from './cart/use-cases.js'
import { kyselyProductRepository } from './catalog/infrastructure.js'
import { adminProductRoutes, productRoutes } from './catalog/routes.js'
import { catalogUseCases, type CatalogUseCases } from './catalog/use-cases.js'
import { cartGatewayAdapter, catalogGatewayAdapter, kyselyOrderRepository } from './ordering/infrastructure.js'
import { orderRoutes } from './ordering/routes.js'
import { orderingUseCases, type OrderingUseCases } from './ordering/use-cases.js'
import { kyselyPaymentIntentRepository, orderingGatewayAdapter } from './payments/infrastructure.js'
import { mockPspRoutes, paymentRoutes } from './payments/routes.js'
import { paymentsUseCases, type PaymentsUseCases } from './payments/use-cases.js'
import { parseEmail, parseRawPassword } from './identity/domain.js'
import { bcryptPasswordHasher, jwtTokenIssuer, kyselyUserRepository } from './identity/infrastructure.js'
import { authRoutes, demoAuthRoutes } from './identity/routes.js'
import { identityUseCases, type IdentityUseCases } from './identity/use-cases.js'
import type { AppConfig } from './platform/config.js'
import { contractDocument, registerContractSchemas } from './platform/contract.js'
import { createAmbientTransactions } from './platform/db/transaction.js'
import type { DB } from './platform/db/types.js'
import { registerErrorHandler } from './platform/errors.js'
import { createTokenService, type TokenService } from './platform/security.js'
import { healthRoutes } from './health/routes.js'

export interface AppDeps {
  config: AppConfig
  db: Kysely<DB>
}

export interface App {
  fastify: FastifyInstance
  tokens: TokenService
  identity: IdentityUseCases
  catalog: CatalogUseCases
  cart: CartUseCases
  ordering: OrderingUseCases
  payments: PaymentsUseCases
  /** Every registered route (method + fastify path) — the anti-drift gate reads this. */
  routes: ReadonlyArray<{ method: string; path: string }>
  /** Seeds the ADMIN (always) and demo VIEWER (when enabled) — bootstrapSeedUsers mirror. */
  seedUsers(): Promise<void>
}

/**
 * Composition root — the DependencyInjection.kt mirror. Plain construction,
 * no DI framework; contexts receive their ports here.
 */
export async function buildApp({ config, db }: AppDeps): Promise<App> {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' },
  })

  const routes: Array<{ method: string; path: string }> = []
  fastify.addHook('onRoute', (route) => {
    for (const method of Array.isArray(route.method) ? route.method : [route.method]) {
      if (method !== 'HEAD' && method !== 'OPTIONS') routes.push({ method, path: route.path })
    }
  })

  await fastify.register(cors, {
    origin: config.corsAllowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  registerContractSchemas(fastify)
  registerErrorHandler(fastify)

  const tokens = createTokenService(config.jwt)

  // Composition: one ambient transaction runner shared by every context —
  // the JOIN semantics the cross-context flows rely on depend on this.
  const tx = createAmbientTransactions(db)
  const identity = identityUseCases({
    users: kyselyUserRepository(tx),
    hasher: bcryptPasswordHasher(),
    tokens: jwtTokenIssuer(tokens),
    tx,
    demo: config.demo,
  })
  const catalog = catalogUseCases(kyselyProductRepository(tx), tx)
  const cart = cartUseCases(kyselyCartRepository(tx), catalogAdapter(catalog), tx)
  const ordering = orderingUseCases(
    cartGatewayAdapter(cart),
    catalogGatewayAdapter(catalog),
    kyselyOrderRepository(tx),
    tx,
  )
  const payments = paymentsUseCases(
    orderingGatewayAdapter(ordering),
    kyselyPaymentIntentRepository(tx),
    config.payments,
    tx,
  )

  // The contract, served verbatim (ADR-0010): regeneration against this
  // endpoint must reproduce the committed client byte-for-byte.
  const document = contractDocument({
    demoLoginEnabled: config.demo.loginEnabled,
    mockPspEnabled: config.payments.mockPspEnabled,
  })
  fastify.get('/openapi.json', () => document)

  healthRoutes(fastify, db)
  authRoutes(fastify, identity, tokens)
  if (config.demo.loginEnabled) demoAuthRoutes(fastify, identity)
  productRoutes(fastify, catalog)
  adminProductRoutes(fastify, catalog, tokens)
  cartRoutes(fastify, cart, tokens)
  orderRoutes(fastify, ordering, tokens)
  paymentRoutes(fastify, payments, tokens)
  if (config.payments.mockPspEnabled) mockPspRoutes(fastify, payments, config.payments, tokens)

  // Load deferred plugins (the webhook's raw-body scope) so the route table
  // is complete when buildApp returns.
  await fastify.ready()

  return {
    fastify,
    tokens,
    identity,
    catalog,
    cart,
    ordering,
    payments,
    routes,
    async seedUsers() {
      await identity.ensureSeedUser(parseEmail(config.admin.email), parseRawPassword(config.admin.password), 'ADMIN')
      // The viewer only exists where the demo endpoint does — never seed a
      // known-password account in an environment that didn't opt in.
      if (config.demo.loginEnabled) {
        await identity.ensureSeedUser(
          parseEmail(config.demo.viewerEmail),
          parseRawPassword(config.demo.viewerPassword),
          'VIEWER',
        )
      }
    },
  }
}
