import { sql } from 'kysely'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import spec from '@ethereal-nature/api-client/openapi.json' with { type: 'json' }
import { opSchema } from '../src/platform/contract.js'
import { createAmbientTransactions } from '../src/platform/db/transaction.js'
import { startTestApp, type TestHarness } from './helpers.js'

let harness: TestHarness

beforeAll(async () => {
  harness = await startTestApp()
})

afterAll(async () => {
  await harness.close()
})

describe('platform boot', () => {
  it('serves health with the database up', async () => {
    const res = await harness.app.fastify.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok', database: 'up' })
  })

  it('serves the committed OpenAPI contract verbatim', async () => {
    const res = await harness.app.fastify.inject({ method: 'GET', url: '/openapi.json' })
    expect(res.statusCode).toBe(200)
    // Deep-equal to the committed file: the contract is served, not re-derived.
    expect(res.json()).toEqual(spec)
  })

  it('unknown routes return the error shape', async () => {
    const res = await harness.app.fastify.inject({ method: 'GET', url: '/nope' })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toHaveProperty('code')
  })
})

describe('contract schema derivation', () => {
  it('derives body and response schemas from a spec operation', () => {
    const schema = opSchema('/auth/register', 'post')
    expect(schema.body).toEqual({ $ref: 'RegisterRequest#' })
    expect((schema.response as Record<string, unknown>)['201']).toEqual({ $ref: 'AuthResponse#' })
  })

  it('throws on operations missing from the contract', () => {
    expect(() => opSchema('/health' as never, 'put')).toThrow(/contract/)
  })
})

describe('ambient transactions', () => {
  it('nested run() JOINS the outer transaction (same backend pid)', async () => {
    const tx = createAmbientTransactions(harness.db)
    const pids = await tx.run(async () => {
      const outer = await sql<{ pid: number }>`select pg_backend_pid() as pid`.execute(tx.getExecutor())
      const inner = await tx.run(async () => {
        const row = await sql<{ pid: number }>`select pg_backend_pid() as pid`.execute(tx.getExecutor())
        return row.rows[0]!.pid
      })
      return { outer: outer.rows[0]!.pid, inner }
    })
    expect(pids.inner).toBe(pids.outer)
  })

  it('outer rollback discards writes made in a joined inner run()', async () => {
    const tx = createAmbientTransactions(harness.db)
    const marker = `tx-proof-${Date.now()}`
    await expect(
      tx.run(async () => {
        await tx.run(async () => {
          await sql`create table if not exists tx_proof (marker text)`.execute(tx.getExecutor())
          await sql`insert into tx_proof values (${marker})`.execute(tx.getExecutor())
        })
        throw new Error('force rollback')
      }),
    ).rejects.toThrow('force rollback')
    const found = await sql<{ n: number }>`
      select count(*)::int as n from pg_tables where tablename = 'tx_proof'
    `.execute(harness.db)
    expect(found.rows[0]!.n).toBe(0) // DDL rolled back with everything else
  })

  it('reads outside any transaction use the base pool', async () => {
    const tx = createAmbientTransactions(harness.db)
    const res = await sql<{ one: number }>`select 1 as one`.execute(tx.getExecutor())
    expect(res.rows[0]!.one).toBe(1)
  })

  it('concurrent top-level runs get distinct connections (no ALS bleed)', async () => {
    const tx = createAmbientTransactions(harness.db)
    const pidOf = () =>
      tx.run(async () => {
        // Hold the tx briefly so the two overlap.
        const row = await sql<{ pid: number }>`select pg_backend_pid() as pid, pg_sleep(0.05)`.execute(
          tx.getExecutor(),
        )
        return row.rows[0]!.pid
      })
    const [a, b] = await Promise.all([pidOf(), pidOf()])
    expect(a).not.toBe(b)
  })
})
