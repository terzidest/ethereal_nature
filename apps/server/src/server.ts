import { buildApp } from './app.js'
import { loadConfig } from './platform/config.js'
import { createDb, createPool } from './platform/db/client.js'
import { migrate } from './platform/migrate.js'

// Until the Kotlin backend is decommissioned, the SQL migrations stay in its
// tree and both backends share them (they are plain SQL).
const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ?? new URL('../../backend/src/main/resources/db/migration', import.meta.url).pathname

const config = loadConfig()
const pool = createPool(config)
const applied = await migrate(pool, MIGRATIONS_DIR)
const db = createDb(pool)

const app = await buildApp({ config, db })
const { fastify } = app
if (applied > 0) fastify.log.info(`applied ${applied} migrations`)
await app.seedUsers()

await fastify.listen({ port: config.port, host: '0.0.0.0' })
