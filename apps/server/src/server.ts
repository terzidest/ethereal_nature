import { buildApp } from './app.js'
import { loadConfig } from './platform/config.js'
import { createDb, createPool } from './platform/db/client.js'
import { migrate } from './platform/migrate.js'

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? new URL('../migrations', import.meta.url).pathname

const config = loadConfig()
const pool = createPool(config)
const applied = await migrate(pool, MIGRATIONS_DIR)
const db = createDb(pool)

const app = await buildApp({ config, db })
const { fastify } = app
if (applied > 0) fastify.log.info(`applied ${applied} migrations`)
await app.seedUsers()

await fastify.listen({ port: config.port, host: '0.0.0.0' })

// Release stock held by unpaid orders (ADR-0012): one sweep a minute. Safe
// with several instances because every cancel is compare-and-set. Started
// here rather than in buildApp so tests drive the use case directly.
const SWEEP_INTERVAL_MS = 60_000
async function sweepUnpaidOrders() {
  try {
    const cancelled = await app.ordering.cancelOverdueOrders()
    if (cancelled > 0) fastify.log.info(`released stock from ${cancelled} unpaid order(s) past the payment window`)
  } catch (error) {
    fastify.log.error({ err: error }, 'unpaid-order sweep failed; retrying next minute')
  }
}
void sweepUnpaidOrders()
setInterval(() => void sweepUnpaidOrders(), SWEEP_INTERVAL_MS).unref()
