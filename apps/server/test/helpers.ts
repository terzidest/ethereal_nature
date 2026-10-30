import type { Kysely } from 'kysely'
import pg from 'pg'
import { buildApp, type App } from '../src/app.js'
import { loadConfig } from '../src/platform/config.js'
import { createDb, createPool } from '../src/platform/db/client.js'
import { migrate } from '../src/platform/migrate.js'
import type { DB } from '../src/platform/db/types.js'

const MIGRATIONS_DIR = new URL('../../backend/src/main/resources/db/migration', import.meta.url).pathname

export interface TestHarness {
  app: App
  db: Kysely<DB>
  pool: pg.Pool
  close(): Promise<void>
}

/** Boots the real app against the same local Postgres the Kotlin suite uses. */
export async function startTestApp(env: NodeJS.ProcessEnv = {}): Promise<TestHarness> {
  const config = loadConfig({ ...process.env, ...env })
  const pool = createPool(config)
  await migrate(pool, MIGRATIONS_DIR)
  const db = createDb(pool)
  const app = await buildApp({ config, db })
  await app.seedUsers()
  return {
    app,
    db,
    pool,
    async close() {
      await app.fastify.close()
      await db.destroy() // destroys the pool too
    },
  }
}
