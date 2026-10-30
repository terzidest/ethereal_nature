import { randomUUID } from 'node:crypto'
import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  canTransitionTo,
  makeOrder,
  makeOrderLine,
  orderTotalMinor,
  priceCart,
  pricedTotalMinor,
  type OrderIntent,
  type ProductInfo,
} from '../src/ordering/domain.js'
import { startTestApp, type TestHarness } from './helpers.js'

const info = (overrides: Partial<ProductInfo> = {}): ProductInfo => ({
  name: 'Herb',
  priceMinor: 1000,
  currency: 'EUR',
  stock: 10,
  archived: false,
  ...overrides,
})

describe('priceCart + status machine (ported from OrderDomainTest)', () => {
  const A = randomUUID()
  const intents: OrderIntent[] = [{ productId: A, quantity: 2 }]

  it('prices exclusively from the catalog snapshot and totals correctly', () => {
    const priced = priceCart(intents, new Map([[A, info({ priceMinor: 1250 })]]))
    expect(priced.issues).toEqual([])
    expect(priced.lines[0]!.unitPriceMinor).toBe(1250)
    expect(pricedTotalMinor(priced)).toBe(2500)
  })

  it('short stock blocks instead of clamping', () => {
    const priced = priceCart(intents, new Map([[A, info({ stock: 1 })]]))
    expect(priced.lines).toEqual([])
    expect(priced.issues).toEqual([
      { productId: A, name: 'Herb', kind: 'INSUFFICIENT_STOCK', requestedQuantity: 2, availableStock: 1 },
    ])
  })

  it('missing and archived products are UNAVAILABLE', () => {
    const missing = priceCart(intents, new Map())
    expect(missing.issues[0]).toMatchObject({ kind: 'UNAVAILABLE', name: null, availableStock: 0 })
    const archived = priceCart(intents, new Map([[A, info({ archived: true })]]))
    expect(archived.issues[0]).toMatchObject({ kind: 'UNAVAILABLE', name: 'Herb' })
  })

  it('status transitions are strictly linear', () => {
    expect(canTransitionTo('PLACED', 'PAID')).toBe(true)
    expect(canTransitionTo('PAID', 'PACKED')).toBe(true)
    expect(canTransitionTo('PLACED', 'SHIPPED')).toBe(false)
    expect(canTransitionTo('SHIPPED', 'PLACED')).toBe(false)
    expect(canTransitionTo('PAID', 'PAID')).toBe(false)
  })
})

describe('order invariants (ported from OrderInvariantsTest)', () => {
  const line = { productId: randomUUID(), name: 'X', quantity: 1, unitPriceMinor: 100, currency: 'EUR' }

  it('line quantity must be positive and price non-negative', () => {
    expect(() => makeOrderLine({ ...line, quantity: 0 })).toThrow(/quantity/)
    expect(() => makeOrderLine({ ...line, unitPriceMinor: -1 })).toThrow(/price/)
  })

  it('an order needs at least one line', () => {
    expect(() =>
      makeOrder({ id: randomUUID(), userId: randomUUID(), lines: [], status: 'PLACED', placedAt: new Date() }),
    ).toThrow(/at least one line/)
  })

  it('total is the sum of line totals', () => {
    const order = makeOrder({
      id: randomUUID(),
      userId: randomUUID(),
      lines: [
        { ...line, quantity: 2, unitPriceMinor: 150 },
        { ...line, productId: randomUUID(), quantity: 1, unitPriceMinor: 700 },
      ],
      status: 'PLACED',
      placedAt: new Date(),
    })
    expect(orderTotalMinor(order)).toBe(1000)
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

let cachedAdmin: string | null = null
async function adminToken(): Promise<string> {
  if (cachedAdmin) return cachedAdmin
  const res = await inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@ethereal.dev', password: 'admin-dev-password' },
  })
  cachedAdmin = res.json().token as string
  return cachedAdmin
}

async function freshCustomer(): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: `ord-${stamp()}@example.com`, password: 's3cret-pass' },
  })
  return res.json().token as string
}

async function createProduct(priceMinor: number, stock: number): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/admin/products',
    headers: { authorization: `Bearer ${await adminToken()}` },
    payload: {
      name: `Order Herb ${stamp()}`,
      description: 'Order test product.',
      priceMinor,
      currency: 'EUR',
      stock,
      category: 'HERBS',
    },
  })
  return res.json().id as string
}

async function putItem(token: string, productId: string, quantity: number) {
  return inject({
    method: 'PUT',
    url: '/cart/items',
    headers: { authorization: `Bearer ${token}` },
    payload: { productId, quantity },
  })
}

async function placeOrder(token: string, expectedTotalMinor: number) {
  return inject({
    method: 'POST',
    url: '/orders',
    headers: { authorization: `Bearer ${token}` },
    payload: { expectedTotalMinor },
  })
}

async function productStock(productId: string): Promise<number> {
  return (await inject({ method: 'GET', url: `/products/${productId}` })).json().stock as number
}

describe('order routes (ported from OrderRoutesTest)', () => {
  it('placing an order decrements stock, freezes the order, and empties the cart', async () => {
    const token = await freshCustomer()
    const productId = await createProduct(1250, 10)
    await putItem(token, productId, 2)

    const placed = await placeOrder(token, 2500)
    expect(placed.statusCode).toBe(201)
    const order = placed.json()
    expect(order.status).toBe('PLACED')
    expect(order.totalMinor).toBe(2500)
    expect(order.lines[0].lineTotalMinor).toBe(2500)

    expect(await productStock(productId)).toBe(8)

    const cart = await inject({ method: 'GET', url: '/cart', headers: { authorization: `Bearer ${token}` } })
    expect(cart.json().lines).toEqual([])

    const history = await inject({ method: 'GET', url: '/orders', headers: { authorization: `Bearer ${token}` } })
    expect(history.body).toContain(order.id)
  })

  it('stale expected total is rejected with the current total, nothing changes', async () => {
    const token = await freshCustomer()
    const productId = await createProduct(1850, 5)
    await putItem(token, productId, 1)

    const rejected = await placeOrder(token, 1)
    expect(rejected.statusCode).toBe(409)
    expect(rejected.json().currentTotalMinor).toBe(1850)
    expect(rejected.json().issues).toEqual([])

    expect(await productStock(productId)).toBe(5) // untouched
    const cart = await inject({ method: 'GET', url: '/cart', headers: { authorization: `Bearer ${token}` } })
    expect(cart.json().lines).toHaveLength(1)

    expect((await placeOrder(token, 1850)).statusCode).toBe(201)
  })

  it('an empty cart cannot be ordered', async () => {
    const token = await freshCustomer()
    const res = await placeOrder(token, 0)
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('EMPTY_CART')
  })

  it("orders are private — another user's order id is a 404", async () => {
    const owner = await freshCustomer()
    const productId = await createProduct(1000, 5)
    await putItem(owner, productId, 1)
    const orderId = (await placeOrder(owner, 1000)).json().id as string

    const other = await freshCustomer()
    const res = await inject({
      method: 'GET',
      url: `/orders/${orderId}`,
      headers: { authorization: `Bearer ${other}` },
    })
    expect(res.statusCode).toBe(404)
  })

  it('admin advances status linearly, cannot skip, customers cannot transition', async () => {
    const customer = await freshCustomer()
    const productId = await createProduct(1000, 5)
    await putItem(customer, productId, 1)
    const orderId = (await placeOrder(customer, 1000)).json().id as string
    const admin = await adminToken()

    const transition = (status: string, token: string) =>
      inject({
        method: 'POST',
        url: `/admin/orders/${orderId}/status`,
        headers: { authorization: `Bearer ${token}` },
        payload: { status },
      })

    expect((await transition('SHIPPED', admin)).statusCode).toBe(409)
    expect((await transition('PAID', admin)).json().status).toBe('PAID')
    expect((await transition('PACKED', admin)).json().status).toBe('PACKED')
    expect((await transition('SHIPPED', customer)).statusCode).toBe(403)

    const list = await inject({
      method: 'GET',
      url: '/admin/orders?status=PACKED&pageSize=100',
      headers: { authorization: `Bearer ${admin}` },
    })
    expect(list.body).toContain(orderId)
  })

  it('admin list status filter returns only matching orders', async () => {
    const customer = await freshCustomer()
    const productId = await createProduct(1000, 10)
    await putItem(customer, productId, 1)
    const placedId = (await placeOrder(customer, 1000)).json().id as string
    await putItem(customer, productId, 1)
    const paidId = (await placeOrder(customer, 1000)).json().id as string
    const admin = await adminToken()
    await inject({
      method: 'POST',
      url: `/admin/orders/${paidId}/status`,
      headers: { authorization: `Bearer ${admin}` },
      payload: { status: 'PAID' },
    })

    const page = await inject({
      method: 'GET',
      url: '/admin/orders?status=PAID&pageSize=100',
      headers: { authorization: `Bearer ${admin}` },
    })
    const items = page.json().items as Array<{ id: string; status: string }>
    expect(new Set(items.map((o) => o.status))).toEqual(new Set(['PAID']))
    expect(items.some((o) => o.id === paidId)).toBe(true)
    expect(items.some((o) => o.id === placedId)).toBe(false)
  })

  it('viewer reads orders but cannot transition status', async () => {
    const customer = await freshCustomer()
    const productId = await createProduct(1000, 5)
    await putItem(customer, productId, 1)
    const orderId = (await placeOrder(customer, 1000)).json().id as string
    const viewer = (await inject({ method: 'POST', url: '/auth/demo' })).json().token as string

    const list = await inject({
      method: 'GET',
      url: '/admin/orders',
      headers: { authorization: `Bearer ${viewer}` },
    })
    expect(list.statusCode).toBe(200)
    const detail = await inject({
      method: 'GET',
      url: `/orders/${orderId}`,
      headers: { authorization: `Bearer ${viewer}` },
    })
    expect(detail.statusCode).toBe(200)

    const transition = await inject({
      method: 'POST',
      url: `/admin/orders/${orderId}/status`,
      headers: { authorization: `Bearer ${viewer}` },
      payload: { status: 'PAID' },
    })
    expect(transition.statusCode).toBe(403)
  })

  it('a catalog price change never alters a placed order snapshot', async () => {
    const token = await freshCustomer()
    const productId = await createProduct(2000, 10)
    await putItem(token, productId, 1)
    const order = (await placeOrder(token, 2000)).json()
    expect(order.lines[0].unitPriceMinor).toBe(2000)

    // Admin doubles the price afterwards.
    const admin = await adminToken()
    await inject({
      method: 'PUT',
      url: `/admin/products/${productId}`,
      headers: { authorization: `Bearer ${admin}` },
      payload: {
        name: 'Snapshot Sage renamed',
        description: 'Changed.',
        priceMinor: 4000,
        currency: 'EUR',
        stock: 9,
        category: 'HERBS',
      },
    })

    const reread = await inject({
      method: 'GET',
      url: `/orders/${order.id}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(reread.json().lines[0].unitPriceMinor).toBe(2000)
    expect(reread.json().totalMinor).toBe(2000)
  })
})
