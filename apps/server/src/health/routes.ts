import { sql } from 'kysely'
import type { FastifyInstance } from 'fastify'
import type { Kysely } from 'kysely'
import type { DB } from '../platform/db/types.js'
import { opSchema } from '../platform/contract.js'

export function healthRoutes(app: FastifyInstance, db: Kysely<DB>): void {
  app.get('/health', { schema: opSchema('/health', 'get') }, async () => {
    const database = await sql`select 1`
      .execute(db)
      .then(() => 'up' as const)
      .catch(() => 'down' as const)
    return { status: 'ok', database }
  })
}
