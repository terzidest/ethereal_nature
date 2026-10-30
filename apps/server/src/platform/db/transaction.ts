import { AsyncLocalStorage } from 'node:async_hooks'
import type { Kysely, Transaction } from 'kysely'
import type { DB } from './types.js'

/**
 * Ambient transactions — the TS equivalent of Exposed's thread-local
 * `transaction(db) { }`. A use case wraps its work in `run()`; repositories
 * execute on `getExecutor()`, which resolves to the ambient transaction when
 * one is open, else the base pool.
 *
 * `run()` inside an open transaction JOINS it (no savepoint, same connection)
 * — exactly the Exposed default the cross-context flows rely on: PlaceOrder
 * wraps cart+catalog+orders in one atomic tx; HandlePspEvent wraps intent
 * settle + ordering's markPaid.
 *
 * This JOIN semantic is only sound because every context shares this ONE
 * runner, ALS, and database. If a context ever gets its own database, the
 * cross-context transactional flows must be redesigned (same caveat as the
 * Kotlin version). Never fire-and-forget promises inside `run()` — the
 * connection is released at commit.
 */
const als = new AsyncLocalStorage<Transaction<DB>>()

export interface AmbientTransactions {
  run<T>(fn: () => Promise<T>): Promise<T>
  getExecutor(): Kysely<DB>
}

export function createAmbientTransactions(db: Kysely<DB>): AmbientTransactions {
  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      if (als.getStore()) return fn() // JOIN the outer transaction
      return db.transaction().execute((trx) => als.run(trx, fn))
    },
    getExecutor(): Kysely<DB> {
      return als.getStore() ?? db
    },
  }
}
