import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import type { Kysely } from 'kysely'
import type { AppConfig } from './platform/config.js'
import { contractDocument, registerContractSchemas } from './platform/contract.js'
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
}

/**
 * Composition root — the DependencyInjection.kt mirror. Plain construction,
 * no DI framework; contexts receive their ports here.
 */
export async function buildApp({ config, db }: AppDeps): Promise<App> {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' },
  })

  await fastify.register(cors, {
    origin: config.corsAllowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  registerContractSchemas(fastify)
  registerErrorHandler(fastify)

  const tokens = createTokenService(config.jwt)

  // The contract, served verbatim (ADR-0010): regeneration against this
  // endpoint must reproduce the committed client byte-for-byte.
  const document = contractDocument({
    demoLoginEnabled: config.demo.loginEnabled,
    mockPspEnabled: config.payments.mockPspEnabled,
  })
  fastify.get('/openapi.json', () => document)

  healthRoutes(fastify, db)

  return { fastify, tokens }
}
