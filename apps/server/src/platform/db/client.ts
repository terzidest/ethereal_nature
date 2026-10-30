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

export function createPool(config: AppConfig): pg.Pool {
  const { url, user, password } = config.database
  return new pg.Pool({
    ...(url ? { connectionString: url } : { host: 'localhost', port: 5432, database: 'ethereal_nature' }),
    ...(user ? { user } : {}),
    ...(password ? { password } : {}),
    max: 5, // parity with Hikari maximumPoolSize
  })
}

export function createDb(pool: pg.Pool): Kysely<DB> {
  return new Kysely<DB>({ dialect: new PostgresDialect({ pool }) })
}
