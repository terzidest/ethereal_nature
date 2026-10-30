import { randomUUID } from 'node:crypto'
import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { makeGuestLine, mergeCarts, type ProductInfo } from '../src/cart/domain.js'
import { startTestApp, type TestHarness } from './helpers.js'

const info = (overrides: Partial<ProductInfo> = {}): ProductInfo => ({
  name: 'Herb',
  category: 'HERBS',
  priceMinor: 1000,
  currency: 'EUR',
  stock: 10,
  archived: false,
  ...overrides,
})

const guest = (productId: string, quantity: number, snapshot: number | null = null) =>
  makeGuestLine(productId, quantity, snapshot)

describe('mergeCarts (ported from MergeCartsTest)', () => {
  const A = randomUUID()
  const B = randomUUID()

  it('sums duplicate products then clamps to stock', () => {
    const products = new Map([[A, info({ stock: 5 })]])
    const result = mergeCarts([guest(A, 4)], [{ productId: A, quantity: 3 }], products)
    expect(result.lines).toEqual([{ productId: A, quantity: 5 }])
    expect(result.adjustments.clamped).toEqual([{ productId: A, requestedQuantity: 7, grantedQuantity: 5 }])
  })

  it('drops unknown, archived, and out-of-stock products with reasons', () => {
    const C = randomUUID()
    const products = new Map([
      [A, info({ archived: true })],
      [B, info({ stock: 0 })],
    ])
    const result = mergeCarts([guest(A, 1), guest(B, 1), guest(C, 1)], [], products)
    expect(result.lines).toEqual([])
    expect(result.adjustments.dropped).toEqual([
      { productId: A, reason: 'ARCHIVED' },
      { productId: B, reason: 'OUT_OF_STOCK' },
      { productId: C, reason: 'NOT_FOUND' },
    ])
  })

  it('reports price changes without ever using the snapshot for math', () => {
    const products = new Map([[A, info({ priceMinor: 1500 })]])
    const result = mergeCarts([guest(A, 2, 1000)], [], products)
    expect(result.adjustments.priceChanged).toEqual([
      { productId: A, snapshotPriceMinor: 1000, currentPriceMinor: 1500 },
    ])
    expect(result.lines).toEqual([{ productId: A, quantity: 2 }])
  })

  it('matching snapshot produces no price-change entry', () => {
    const products = new Map([[A, info({ priceMinor: 1000 })]])
    const result = mergeCarts([guest(A, 1, 1000)], [], products)
    expect(result.adjustments.priceChanged).toEqual([])
  })

  it('empty guest cart is a no-op merge', () => {
    const products = new Map([[A, info()]])
    const result = mergeCarts([], [{ productId: A, quantity: 2 }], products)
    expect(result.lines).toEqual([{ productId: A, quantity: 2 }])
    expect(result.adjustments.dropped).toEqual([])
    expect(result.adjustments.clamped).toEqual([])
  })

  it('existing user lines are re-validated too', () => {
    const result = mergeCarts([], [{ productId: A, quantity: 2 }], new Map())
    expect(result.lines).toEqual([])
    expect(result.adjustments.dropped).toEqual([{ productId: A, reason: 'NOT_FOUND' }])
  })

  it('preserves existing order and appends new guest products', () => {
    const products = new Map([
      [A, info()],
      [B, info()],
    ])
    const result = mergeCarts([guest(B, 1)], [{ productId: A, quantity: 1 }], products)
    expect(result.lines.map((l) => l.productId)).toEqual([A, B])
  })
})

let harness: TestHarness

beforeAll(async () => {
  harness = await startTestApp()
})

afterAll(async () => {
  await harness.close()
})

const inject = (opts: InjectOptions) => harness.app.fastify.inject(opts)
const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`

async function freshCustomer(): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: `cart-${stamp()}@example.com`, password: 's3cret-pass' },
  })
  return res.json().token as string
}

async function adminCreateProduct(stock: number, priceMinor = 1000): Promise<string> {
  const admin = (
    await inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@ethereal.dev', password: 'admin-dev-password' },
    })
  ).json().token as string
  const res = await inject({
    method: 'POST',
    url: '/admin/products',
    headers: { authorization: `Bearer ${admin}` },
    payload: {
      name: `Cart Herb ${stamp()}`,
      description: 'Cart test product.',
      priceMinor,
      currency: 'EUR',
      stock,
      category: 'HERBS',
    },
  })
  return res.json().id as string
}

describe('cart routes (ported from CartRoutesTest)', () => {
  it('all endpoints require authentication', async () => {
    for (const req of [
      { method: 'GET' as const, url: '/cart' },
      { method: 'POST' as const, url: '/cart/merge', payload: { mergeId: randomUUID(), lines: [] } },
      { method: 'PUT' as const, url: '/cart/items', payload: { productId: randomUUID(), quantity: 1 } },
    ]) {
      const res = await inject(req)
      expect(res.statusCode).toBe(401)
    }
  })

  it('merge sums then clamps, reports adjustments, and is idempotent per mergeId', async () => {
    const token = await freshCustomer()
    const productId = await adminCreateProduct(5)
    const headers = { authorization: `Bearer ${token}` }

    // Existing line of 3.
    await inject({ method: 'PUT', url: '/cart/items', headers, payload: { productId, quantity: 3 } })

    const mergeId = randomUUID()
    const payload = { mergeId, lines: [{ productId, quantity: 4, priceSnapshotMinor: 999 }] }
    const merged = await inject({ method: 'POST', url: '/cart/merge', headers, payload })
    expect(merged.statusCode).toBe(200)
    const body = merged.json()
    expect(body.cart.lines).toHaveLength(1)
    expect(body.cart.lines[0].quantity).toBe(5) // 3 + 4 clamped to stock 5
    expect(body.adjustments.clamped).toHaveLength(1)
    expect(body.adjustments.priceChanged).toHaveLength(1) // snapshot 999 vs 1000
    expect(body.cart.subtotalMinor).toBe(5000)

    // Replay with the same mergeId: no doubling, no adjustments.
    const replay = await inject({ method: 'POST', url: '/cart/merge', headers, payload })
    const replayBody = replay.json()
    expect(replayBody.cart.lines[0].quantity).toBe(5)
    expect(replayBody.adjustments.dropped).toEqual([])
    expect(replayBody.adjustments.clamped).toEqual([])
    expect(replayBody.adjustments.priceChanged).toEqual([])
  })

  it('set item upserts, clamps to stock, and removes at quantity 0', async () => {
    const token = await freshCustomer()
    const productId = await adminCreateProduct(4)
    const headers = { authorization: `Bearer ${token}` }

    const first = await inject({ method: 'PUT', url: '/cart/items', headers, payload: { productId, quantity: 2 } })
    expect(first.json().lines[0].quantity).toBe(2)

    // Clamped to stock.
    const clamped = await inject({ method: 'PUT', url: '/cart/items', headers, payload: { productId, quantity: 9 } })
    expect(clamped.json().lines[0].quantity).toBe(4)

    // Unknown product → 409 PRODUCT_UNAVAILABLE.
    const unavailable = await inject({
      method: 'PUT',
      url: '/cart/items',
      headers,
      payload: { productId: '00000000-0000-4000-8000-000000000000', quantity: 1 },
    })
    expect(unavailable.statusCode).toBe(409)
    expect(unavailable.json().code).toBe('PRODUCT_UNAVAILABLE')

    // Remove at 0.
    const removed = await inject({ method: 'PUT', url: '/cart/items', headers, payload: { productId, quantity: 0 } })
    expect(removed.statusCode).toBe(200)
    expect(removed.json().lines).toEqual([])
    expect(removed.json().subtotalMinor).toBe(0)
  })
})
