import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { AppConfig } from '../config.js'
import type { DB } from './types.js'

// pg returns int8 (OID 20) as string; every money/count column is bigint minor
// units far below 2^53, so parse to Number with a tripwire rather than
// spreading bigint through the domain.
const int8ToNumber = (value: string): number => {
  const n = Number(value)
  if (!Number.isSafeInteger(n)) throw new Error(`int8 value ${value} exceeds Number.MAX_SAFE_INTEGER`)
  return n
}
pg.types.setTypeParser(20, int8ToNumber)

/**
 * pg TRAP (cost us the first cutover deploy): passing `user`/`password`
 * options ALONGSIDE `connectionString` makes pg silently ignore them — the
 * user falls back to the OS username. Never hand pg a connectionString plus
 * overrides; parse the URL ourselves and build discrete options.
 */
export function poolOptions(database: AppConfig['database']): pg.PoolConfig {
  const { url, user, password } = database
  const base: pg.PoolConfig = { host: 'localhost', port: 5432, database: 'ethereal_nature' }
  if (url) {
    const parsed = new URL(url)
    base.host = parsed.hostname
    base.port = parsed.port ? Number(parsed.port) : 5432
    base.database = parsed.pathname.replace(/^\//, '')
    if (parsed.username) base.user = decodeURIComponent(parsed.username)
    if (parsed.password) base.password = decodeURIComponent(parsed.password)
  }
  if (user) base.user = user
  if (password) base.password = password
  return { ...base, max: 5 } // max: parity with Hikari maximumPoolSize
}

export function createPool(config: AppConfig): pg.Pool {
  return new pg.Pool(poolOptions(config.database))
}

export function createDb(pool: pg.Pool): Kysely<DB> {
  return new Kysely<DB>({ dialect: new PostgresDialect({ pool }) })
}
