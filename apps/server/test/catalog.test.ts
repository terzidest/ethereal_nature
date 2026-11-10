import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { categoryCounts, makeProduct, parseImages, parseMoney, parseSpecs, parseStock, slugify } from '../src/catalog/domain.js'
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
    const base = {
      category: null,
      search: null,
      sort: 'NEWEST' as const,
      minPriceMinor: null,
      maxPriceMinor: null,
      includeArchived: false,
    }
    expect(() => makeProductQuery({ page: 0, pageSize: 10, ...base })).toThrow(/page/)
    expect(() => makeProductQuery({ page: 1, pageSize: 0, ...base })).toThrow(/pageSize/)
    expect(() => makeProductQuery({ page: 1, pageSize: 101, ...base })).toThrow(/pageSize/)
  })

  it('categoryCounts lists every category in catalog order, zero-filled', () => {
    expect(categoryCounts(new Map([['TEAS', 3], ['OILS', 4]]))).toEqual([
      { category: 'OILS', productCount: 4 },
      { category: 'HERBS', productCount: 0 },
      { category: 'CRYSTALS', productCount: 0 },
      { category: 'TEAS', productCount: 3 },
    ])
  })

  it('the main photo is always the first gallery image', () => {
    const base = {
      id: '00000000-0000-4000-8000-000000000001',
      slug: 'sage',
      name: 'Sage',
      description: 'd',
      price: { amountMinor: 100, currency: 'EUR' },
      stock: 1,
      category: 'HERBS' as const,
      specs: { summary: null, origin: null, size: null, weight: null },
      archived: false,
      createdAt: new Date(),
    }
    expect(makeProduct({ ...base, images: [] }).imageUrl).toBeNull()
    const product = makeProduct({
      ...base,
      images: [
        { url: ' https://img.test/a.jpg ', label: '  ' },
        { url: 'https://img.test/b.jpg', label: 'Back' },
      ],
    })
    expect(product.imageUrl).toBe('https://img.test/a.jpg')
    expect(product.images).toEqual([
      { url: 'https://img.test/a.jpg', label: null },
      { url: 'https://img.test/b.jpg', label: 'Back' },
    ])
  })

  it('gallery rules: at most 8 images, http(s) URLs only', () => {
    const image = { url: 'https://img.test/a.jpg', label: null }
    expect(() => parseImages(Array.from({ length: 9 }, () => image))).toThrow(/at most 8/)
    expect(() => parseImages([{ url: 'javascript:alert(1)', label: null }])).toThrow(/http/)
    expect(() => parseImages([{ url: 'img.test/a.jpg', label: null }])).toThrow(/http/)
  })

  it('specs: blank means unset, text is trimmed and capped', () => {
    expect(parseSpecs({ summary: '  ', origin: ' Brazil ', size: null, weight: '' })).toEqual({
      summary: null,
      origin: 'Brazil',
      size: null,
      weight: null,
    })
    expect(() => parseSpecs({ summary: 'x'.repeat(301), origin: null, size: null, weight: null })).toThrow(/summary/)
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

  it('filters by inclusive price bounds; malformed bounds are ignored', async () => {
    const admin = await adminToken()
    const tag = stamp()
    for (const priceMinor of [499, 500, 1500, 1501]) {
      await createProduct(admin, `Priced Parsley ${tag} ${priceMinor}`, { priceMinor })
    }
    const prices = async (query: string) =>
      (await inject({ method: 'GET', url: `/products?q=priced parsley ${tag}&pageSize=100${query}` }))
        .json()
        .items.map((p: { priceMinor: number }) => p.priceMinor)
        .sort((a: number, b: number) => a - b)

    expect(await prices('&minPriceMinor=500&maxPriceMinor=1500')).toEqual([500, 1500])
    expect(await prices('&maxPriceMinor=1500')).toEqual([499, 500, 1500])
    expect(await prices('&minPriceMinor=-5&maxPriceMinor=abc')).toEqual([499, 500, 1500, 1501])
  })

  it('exposes createdAtEpochSeconds', async () => {
    const admin = await adminToken()
    const before = Math.floor(Date.now() / 1000)
    const created = await createProduct(admin, `Fresh Fennel ${stamp()}`)
    expect(created.createdAtEpochSeconds).toBeGreaterThanOrEqual(before - 1)
    const res = await inject({ method: 'GET', url: `/products/${created.id}` })
    expect(res.json().createdAtEpochSeconds).toBe(created.createdAtEpochSeconds)
  })

  it('counts active products per category, archived excluded', async () => {
    const count = async (category: string) => {
      const res = await inject({ method: 'GET', url: '/categories' })
      expect(res.statusCode).toBe(200)
      const categories = res.json().categories as Array<{ category: string; productCount: number }>
      expect(categories.map((c) => c.category)).toEqual(['OILS', 'HERBS', 'CRYSTALS', 'TEAS'])
      return categories.find((c) => c.category === category)!.productCount
    }
    const admin = await adminToken()
    const before = await count('TEAS')
    const tea = await createProduct(admin, `Counted Tea ${stamp()}`, { category: 'TEAS' })
    expect(await count('TEAS')).toBe(before + 1)
    await inject({
      method: 'PUT',
      url: `/admin/products/${tea.id}/archive`,
      headers: { authorization: `Bearer ${admin}` },
      payload: { archived: true },
    })
    expect(await count('TEAS')).toBe(before)
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

  it('stores the gallery in order with specs; the first image is imageUrl', async () => {
    const admin = await adminToken()
    const created = await createProduct(admin, `Gallery Gentian ${stamp()}`, {
      summary: 'Bitter root, dried whole.',
      origin: 'Alps',
      weight: '50 g',
      images: [
        { url: 'https://img.test/front.jpg', label: 'Front view' },
        { url: 'https://img.test/hand.jpg' },
      ],
    })
    expect(created.imageUrl).toBe('https://img.test/front.jpg')
    expect(created.images).toEqual([{ url: 'https://img.test/front.jpg', label: 'Front view' }, { url: 'https://img.test/hand.jpg' }])
    expect(created).toMatchObject({ summary: 'Bitter root, dried whole.', origin: 'Alps', weight: '50 g' })
    expect('size' in created).toBe(false)

    const listed = (await inject({ method: 'GET', url: `/products?q=${encodeURIComponent(created.name)}` })).json()
    expect(listed.items[0].images).toHaveLength(2)

    // PUT replaces the gallery wholesale: reorder, then clear.
    const reordered = await inject({
      method: 'PUT',
      url: `/admin/products/${created.id}`,
      headers: { authorization: `Bearer ${admin}` },
      payload: productBody(created.name, { images: [{ url: 'https://img.test/hand.jpg' }, { url: 'https://img.test/front.jpg' }] }),
    })
    expect(reordered.json().imageUrl).toBe('https://img.test/hand.jpg')
    expect(reordered.json().images.map((i: { url: string }) => i.url)).toEqual([
      'https://img.test/hand.jpg',
      'https://img.test/front.jpg',
    ])
    expect('summary' in reordered.json()).toBe(false)

    const cleared = await inject({
      method: 'PUT',
      url: `/admin/products/${created.id}`,
      headers: { authorization: `Bearer ${admin}` },
      payload: productBody(created.name),
    })
    expect(cleared.json().images).toEqual([])
    expect('imageUrl' in cleared.json()).toBe(false)
  })

  it('rejects a gallery URL that is not http(s) with a 400', async () => {
    const admin = await adminToken()
    const res = await inject({
      method: 'POST',
      url: '/admin/products',
      headers: { authorization: `Bearer ${admin}` },
      payload: productBody('Bad Gallery', { images: [{ url: 'ftp://img.test/a.jpg' }] }),
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('VALIDATION')
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
