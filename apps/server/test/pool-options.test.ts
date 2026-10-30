import { describe, expect, it } from 'vitest'
import { poolOptions } from '../src/platform/db/client.js'

/**
 * Regression for the cutover-deploy failure: pg ignores user/password options
 * passed alongside connectionString, so we parse the URL into discrete
 * options ourselves. These pin every credential-resolution shape.
 */
describe('poolOptions', () => {
  it('parses credentials embedded in the URL (production shape)', () => {
    const opts = poolOptions({
      url: 'postgres://pguser:pgpass@postgres.railway.internal:5432/railway',
      user: undefined,
      password: undefined,
    })
    expect(opts).toMatchObject({
      host: 'postgres.railway.internal',
      port: 5432,
      database: 'railway',
      user: 'pguser',
      password: 'pgpass',
    })
  })

  it('separate DATABASE_USER/PASSWORD override URL credentials (CI/legacy shape)', () => {
    const opts = poolOptions({
      url: 'postgres://urluser:urlpass@db:6432/appdb',
      user: 'realuser',
      password: 'realpass',
    })
    expect(opts).toMatchObject({ host: 'db', port: 6432, database: 'appdb', user: 'realuser', password: 'realpass' })
  })

  it('credential-less URL + separate vars resolves fully (the failed-cutover shape)', () => {
    const opts = poolOptions({
      url: 'postgres://postgres.railway.internal:5432/railway',
      user: 'postgres',
      password: 'secret',
    })
    expect(opts.user).toBe('postgres')
    expect(opts.password).toBe('secret')
  })

  it('URL-encoded passwords are decoded', () => {
    const opts = poolOptions({ url: 'postgres://u:p%40ss%2Fword@h:5432/d', user: undefined, password: undefined })
    expect(opts.password).toBe('p@ss/word')
  })

  it('no URL at all falls back to local development defaults', () => {
    const opts = poolOptions({ url: undefined, user: undefined, password: undefined })
    expect(opts).toMatchObject({ host: 'localhost', port: 5432, database: 'ethereal_nature' })
    expect(opts.user).toBeUndefined()
  })
})
