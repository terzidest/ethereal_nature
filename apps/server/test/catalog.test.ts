import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parseMoney, parseStock, slugify } from '../src/catalog/domain.js'
import { makeProductQuery, totalPages } from '../src/catalog/ports.js'
import { startTestApp, type TestHarness } from './helpers.js'

let harness: TestHarness

beforeAll(async () => {
  harness = await startTestApp()
})

afterAll(async () => {
  await harness.close()
})

const inject = (opts: InjectOptions) => harness.app.fastify.inject(opts)

describe('slugify (ported from SlugifyTest)', () => {
  it('lowercases and collapses non-alphanumerics to single dashes', () => {
    expect(slugify('Lavender Essential Oil')).toBe('lavender-essential-oil')
    expect(slugify('Rose  &  Quartz!!')).toBe('rose-quartz')
  })

  it('trims leading/trailing dashes and never returns empty', () => {
    expect(slugify('--Sage--')).toBe('sage')
    expect(slugify('!!!')).toBe('product')
  })

  it('caps at 100 characters', () => {
    expect(slugify('a'.repeat(150)).length).toBe(100)
  })
})

describe('product domain (ported from ProductDomainTest)', () => {
  it('money rejects negatives and bad currency codes', () => {
    expect(() => parseMoney(-1, 'EUR')).toThrow(/negative/)
    expect(() => parseMoney(100, 'EURO')).toThrow(/currency/)
    expect(() => parseMoney(100, 'eur')).toThrow(/currency/)
  })

  it('stock cannot be negative', () => {
    expect(() => parseStock(-1)).toThrow(/negative/)
    expect(parseStock(0)).toBe(0)
  })

  it('query enforces pagination bounds', () => {
    const base = { category: null, search: null, sort: 'NEWEST' as const, includeArchived: false }
    expect(() => makeProductQuery({ page: 0, pageSize: 10, ...base })).toThrow(/page/)
    expect(() => makeProductQuery({ page: 1, pageSize: 0, ...base })).toThrow(/pageSize/)
    expect(() => makeProductQuery({ page: 1, pageSize: 101, ...base })).toThrow(/pageSize/)
  })

  it('totalPages rounds up and is zero when empty', () => {
    const page = { items: [], page: 1, pageSize: 10 }
    expect(totalPages({ ...page, totalItems: 0 })).toBe(0)
    expect(totalPages({ ...page, totalItems: 10 })).toBe(1)
    expect(totalPages({ ...page, totalItems: 11 })).toBe(2)
  })
})

async function adminToken(): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@ethereal.dev', password: 'admin-dev-password' },
  })
  return res.json().token as string
}

const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`

function productBody(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    description: 'A test product.',
    priceMinor: 1200,
    currency: 'EUR',
    stock: 7,
    category: 'HERBS',
    ...overrides,
  }
}

async function createProduct(admin: string, name: string, overrides: Record<string, unknown> = {}) {
  const res = await inject({
    method: 'POST',
    url: '/admin/products',
    headers: { authorization: `Bearer ${admin}` },
    payload: productBody(name, overrides),
  })
  expect(res.statusCode).toBe(201)
  return res.json()
}

describe('public product routes (ported from ProductRoutesTest)', () => {
  it('lists with pagination metadata', async () => {
    const res = await inject({ method: 'GET', url: '/products?pageSize=2' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items.length).toBeLessThanOrEqual(2)
    expect(body.pageSize).toBe(2)
    expect(body.totalPages).toBe(Math.ceil(body.totalItems / 2))
  })

  it('filters by category + search and excludes archived', async () => {
    const admin = await adminToken()
    const name = `Visible Verbena ${stamp()}`
    await createProduct(admin, name)
    const archived = await createProduct(admin, `Hidden Verbena ${stamp()}`)
    await inject({
      method: 'PUT',
      url: `/admin/products/${archived.id}/archive`,
      headers: { authorization: `Bearer ${admin}` },
      payload: { archived: true },
    })

    const res = await inject({ method: 'GET', url: '/products?category=HERBS&q=verbena&pageSize=100' })
    const names = res.json().items.map((p: { name: string }) => p.name)
    expect(names).toContain(name)
    expect(names.some((n: string) => n.startsWith('Hidden Verbena'))).toBe(false)
  })

  it('sorts by price ascending', async () => {
    const res = await inject({ method: 'GET', url: '/products?sort=price-asc&pageSize=100' })
    const prices = res.json().items.map((p: { priceMinor: number }) => p.priceMinor)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('returns a single product by id', async () => {
    const admin = await adminToken()
    const created = await createProduct(admin, `Single Sorrel ${stamp()}`)
    const res = await inject({ method: 'GET', url: `/products/${created.id}` })
    expect(res.statusCode).toBe(200)
    expect(res.json().slug).toMatch(/^single-sorrel/)
  })

  it('unknown id is 404, malformed id is 400', async () => {
    const missing = await inject({ method: 'GET', url: '/products/00000000-0000-4000-8000-000000000000' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json().code).toBe('PRODUCT_NOT_FOUND')

    const malformed = await inject({ method: 'GET', url: '/products/not-a-uuid' })
    expect(malformed.statusCode).toBe(400)
  })
})

describe('admin product routes (ported from AdminProductRoutesTest)', () => {
  it('create, edit, archive lifecycle with public visibility rules', async () => {
    const admin = await adminToken()
    const name = `Test Herb ${stamp()}`
    const created = await createProduct(admin, name)
    expect(created.slug).toMatch(/^test-herb-/)

    // Visible publicly.
    const pub = await inject({ method: 'GET', url: `/products?q=test+herb&pageSize=100` })
    expect(pub.body).toContain(name)

    // Edit price + stock.
    const updated = await inject({
      method: 'PUT',
      url: `/admin/products/${created.id}`,
      headers: { authorization: `Bearer ${admin}` },
      payload: productBody(name, { priceMinor: 1550, stock: 3 }),
    })
    expect(updated.json().priceMinor).toBe(1550)

    // Archive → gone from public, flagged in admin list.
    await inject({
      method: 'PUT',
      url: `/admin/products/${created.id}/archive`,
      headers: { authorization: `Bearer ${admin}` },
      payload: { archived: true },
    })
    const pubAfter = await inject({ method: 'GET', url: `/products?q=test+herb&pageSize=100` })
    expect(pubAfter.body).not.toContain(name)
    const adminList = await inject({
      method: 'GET',
      url: `/admin/products?q=test+herb&pageSize=100`,
      headers: { authorization: `Bearer ${admin}` },
    })
    const row = adminList.json().items.find((p: { id: string }) => p.id === created.id)
    expect(row.archived).toBe(true)

    // Restore.
    const restored = await inject({
      method: 'PUT',
      url: `/admin/products/${created.id}/archive`,
      headers: { authorization: `Bearer ${admin}` },
      payload: { archived: false },
    })
    expect(restored.json().archived).toBe(false)
  })

  it('validation failures are 400 and writes are admin-only', async () => {
    const admin = await adminToken()
    const negative = await inject({
      method: 'POST',
      url: '/admin/products',
      headers: { authorization: `Bearer ${admin}` },
      payload: productBody('Bad Product', { priceMinor: -5 }),
    })
    expect(negative.statusCode).toBe(400)
    expect(negative.json().code).toBe('VALIDATION')

    const customer = (
      await inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: `cat-${stamp()}@example.com`, password: 's3cret-pass' },
      })
    ).json().token as string
    const forbidden = await inject({
      method: 'POST',
      url: '/admin/products',
      headers: { authorization: `Bearer ${customer}` },
      payload: productBody('Sneaky Product'),
    })
    expect(forbidden.statusCode).toBe(403)
  })

  it('viewer reads the back-office listing but every mutation is rejected', async () => {
    const admin = await adminToken()
    const viewer = (await inject({ method: 'POST', url: '/auth/demo' })).json().token as string
    const name = `Viewer Herb ${stamp()}`
    const created = await createProduct(admin, name)

    const list = await inject({
      method: 'GET',
      url: `/admin/products?q=viewer+herb&pageSize=100`,
      headers: { authorization: `Bearer ${viewer}` },
    })
    expect(list.statusCode).toBe(200)
    expect(list.body).toContain(name)

    for (const attempt of [
      { method: 'POST' as const, url: '/admin/products', payload: productBody('Viewer Sneak') },
      { method: 'PUT' as const, url: `/admin/products/${created.id}`, payload: productBody(name, { priceMinor: 1 }) },
      { method: 'PUT' as const, url: `/admin/products/${created.id}/archive`, payload: { archived: true } },
    ]) {
      const res = await inject({ ...attempt, headers: { authorization: `Bearer ${viewer}` } })
      expect(res.statusCode).toBe(403)
    }
  })

  it('omits imageUrl entirely when unset (explicitNulls=false parity)', async () => {
    const admin = await adminToken()
    const created = await createProduct(admin, `No Image Nettle ${stamp()}`)
    const res = await inject({ method: 'GET', url: `/products/${created.id}` })
    expect(res.statusCode).toBe(200)
    expect('imageUrl' in res.json()).toBe(false)
    expect(res.body).not.toContain('imageUrl')
  })
})
