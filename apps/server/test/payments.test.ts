import { randomUUID } from 'node:crypto'
import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cartGatewayAdapter, catalogGatewayAdapter, kyselyOrderRepository } from '../src/ordering/infrastructure.js'
import { orderingUseCases } from '../src/ordering/use-cases.js'
import { isTerminal, makePaymentIntent, settle, WebhookSignature, type PaymentIntent } from '../src/payments/domain.js'
import { kyselyPaymentIntentRepository, orderingGatewayAdapter } from '../src/payments/infrastructure.js'
import { paymentsUseCases } from '../src/payments/use-cases.js'
import { createAmbientTransactions } from '../src/platform/db/transaction.js'
import { startTestApp, type TestHarness } from './helpers.js'

const WEBHOOK_SECRET = 'dev-only-webhook-secret-do-not-use-in-production'

const intentFixture = (status: PaymentIntent['status'] = 'CREATED'): PaymentIntent =>
  makePaymentIntent({
    id: randomUUID(),
    orderId: randomUUID(),
    userId: randomUUID(),
    amountMinor: 1250,
    currency: 'EUR',
    status,
    createdAt: new Date(),
    settledEventId: null,
  })

describe('payment intent state machine (ported from PaymentDomainTest)', () => {
  it('settles an open intent to a terminal status and records the event', () => {
    const settled = settle(intentFixture(), 'SUCCEEDED', 'evt-1')
    expect(settled.status).toBe('SUCCEEDED')
    expect(settled.settledEventId).toBe('evt-1')
    expect(isTerminal(settled.status)).toBe(true)
  })

  it('an intent can be declined', () => {
    expect(settle(intentFixture(), 'FAILED', 'evt-2').status).toBe('FAILED')
  })

  it('terminal intents are frozen', () => {
    expect(() => settle(intentFixture('SUCCEEDED'), 'FAILED', 'evt-3')).toThrow(/already settled/)
    expect(() => settle(intentFixture('FAILED'), 'SUCCEEDED', 'evt-4')).toThrow(/already settled/)
  })

  it('settling to CREATED is not a settlement', () => {
    expect(() => settle(intentFixture(), 'CREATED', 'evt-5')).toThrow(/terminal/)
  })

  it('invalid amounts and currencies are unconstructible', () => {
    expect(() => makePaymentIntent({ ...intentFixture(), amountMinor: -1 })).toThrow(/negative/)
    expect(() => makePaymentIntent({ ...intentFixture(), currency: 'EURO' })).toThrow(/3-letter/)
  })
})

describe('webhook signature (ported from PaymentDomainTest)', () => {
  const payload = '{"eventId":"e1","intentId":"i1","type":"PAYMENT_SUCCEEDED"}'

  it('sign and verify round trip', () => {
    expect(WebhookSignature.verify('s', payload, WebhookSignature.sign('s', payload))).toBe(true)
  })

  it('tampered payload fails verification', () => {
    const sig = WebhookSignature.sign('s', payload)
    expect(WebhookSignature.verify('s', payload.replace('SUCCEEDED', 'FAILED'), sig)).toBe(false)
  })

  it('wrong secret fails verification', () => {
    expect(WebhookSignature.verify('other', payload, WebhookSignature.sign('s', payload))).toBe(false)
  })

  it('missing or malformed signatures fail without throwing', () => {
    expect(WebhookSignature.verify('s', payload, null)).toBe(false)
    expect(WebhookSignature.verify('s', payload, '')).toBe(false)
    expect(WebhookSignature.verify('s', payload, 'not-hex')).toBe(false)
    expect(WebhookSignature.verify('s', payload, 'abc')).toBe(false) // odd length
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
    payload: { email: `pay-${stamp()}@example.com`, password: 's3cret-pass' },
  })
  return res.json().token as string
}

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

async function placedOrder(token: string, priceMinor = 1250): Promise<string> {
  const admin = await adminToken()
  const product = await inject({
    method: 'POST',
    url: '/admin/products',
    headers: { authorization: `Bearer ${admin}` },
    payload: {
      name: `Pay Herb ${stamp()}`,
      description: 'Payment test product.',
      priceMinor,
      currency: 'EUR',
      stock: 10,
      category: 'HERBS',
    },
  })
  const productId = product.json().id as string
  await inject({
    method: 'PUT',
    url: '/cart/items',
    headers: { authorization: `Bearer ${token}` },
    payload: { productId, quantity: 1 },
  })
  const order = await inject({
    method: 'POST',
    url: '/orders',
    headers: { authorization: `Bearer ${token}` },
    payload: { expectedTotalMinor: priceMinor },
  })
  return order.json().id as string
}

async function createIntent(token: string, orderId: string) {
  return inject({
    method: 'POST',
    url: '/payments/intents',
    headers: { authorization: `Bearer ${token}` },
    payload: { orderId },
  })
}

async function simulate(token: string, intentId: string, outcome: 'PAY' | 'DECLINE') {
  return inject({
    method: 'POST',
    url: `/mock-psp/intents/${intentId}/simulate`,
    headers: { authorization: `Bearer ${token}` },
    payload: { outcome },
  })
}

async function webhook(body: string, signature: string | null) {
  return inject({
    method: 'POST',
    url: '/payments/webhook',
    headers: { 'content-type': 'application/json', ...(signature ? { 'x-webhook-signature': signature } : {}) },
    payload: body,
  })
}

async function orderStatus(token: string, orderId: string): Promise<string> {
  const res = await inject({ method: 'GET', url: `/orders/${orderId}`, headers: { authorization: `Bearer ${token}` } })
  return res.json().status as string
}

describe('payment routes (ported from PaymentRoutesTest)', () => {
  it('happy path: place → intent (201, server-priced) → pay → order PAID', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token, 2500)

    const created = await createIntent(token, orderId)
    expect(created.statusCode).toBe(201)
    expect(created.json().amountMinor).toBe(2500)
    expect(created.json().status).toBe('CREATED')
    const intentId = created.json().id as string

    const paid = await simulate(token, intentId, 'PAY')
    expect(paid.statusCode).toBe(200)
    expect(paid.json().status).toBe('SUCCEEDED')
    expect(await orderStatus(token, orderId)).toBe('PAID')
  })

  it('declined payment leaves the order PLACED; retry mints a new intent', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)
    const intentId = (await createIntent(token, orderId)).json().id as string

    expect((await simulate(token, intentId, 'DECLINE')).json().status).toBe('FAILED')
    expect(await orderStatus(token, orderId)).toBe('PLACED')

    const retry = await createIntent(token, orderId)
    expect(retry.statusCode).toBe(201)
    expect(retry.json().id).not.toBe(intentId)
  })

  it('creating an intent is idempotent while one is open', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)

    const first = await createIntent(token, orderId)
    expect(first.statusCode).toBe(201)
    const second = await createIntent(token, orderId)
    expect(second.statusCode).toBe(200)
    expect(second.json().id).toBe(first.json().id)
  })

  it('replayed success is a no-op, incl. a directly-posted signed duplicate', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)
    const intentId = (await createIntent(token, orderId)).json().id as string

    expect((await simulate(token, intentId, 'PAY')).statusCode).toBe(200)
    expect((await simulate(token, intentId, 'PAY')).statusCode).toBe(200)
    expect(await orderStatus(token, orderId)).toBe('PAID')

    const body = JSON.stringify({ eventId: 'replay-1', intentId, type: 'PAYMENT_SUCCEEDED' })
    const replay = await webhook(body, WebhookSignature.sign(WEBHOOK_SECRET, body))
    expect(replay.statusCode).toBe(200)
    expect(replay.json().status).toBe('already_processed')
  })

  it('webhook rejects bad signatures and malformed bodies without touching state', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)
    const intentId = (await createIntent(token, orderId)).json().id as string

    const body = JSON.stringify({ eventId: 'e1', intentId, type: 'PAYMENT_SUCCEEDED' })
    expect((await webhook(body, 'deadbeef')).statusCode).toBe(401)
    expect((await webhook(body, null)).statusCode).toBe(401)

    const garbage = '{"nope":true}'
    expect((await webhook(garbage, WebhookSignature.sign(WEBHOOK_SECRET, garbage))).statusCode).toBe(400)

    expect(await orderStatus(token, orderId)).toBe('PLACED')
    const intent = await inject({
      method: 'GET',
      url: `/payments/intents/${intentId}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(intent.json().status).toBe('CREATED')
  })

  it('payment intents are private', async () => {
    const owner = await freshCustomer()
    const orderId = await placedOrder(owner)
    const intentId = (await createIntent(owner, orderId)).json().id as string

    const other = await freshCustomer()
    expect((await createIntent(other, orderId)).statusCode).toBe(404)
    const read = await inject({
      method: 'GET',
      url: `/payments/intents/${intentId}`,
      headers: { authorization: `Bearer ${other}` },
    })
    expect(read.statusCode).toBe(404)
    expect((await simulate(other, intentId, 'PAY')).statusCode).toBe(404)
  })

  it('an already paid order is not payable again', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)
    const intentId = (await createIntent(token, orderId)).json().id as string
    await simulate(token, intentId, 'PAY')

    const again = await createIntent(token, orderId)
    expect(again.statusCode).toBe(409)
    expect(again.json().code).toBe('ORDER_NOT_PAYABLE')
  })

  it('admin race: webhook success after a manual PAID transition stays a no-op', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)
    const intentId = (await createIntent(token, orderId)).json().id as string

    const admin = await adminToken()
    await inject({
      method: 'POST',
      url: `/admin/orders/${orderId}/status`,
      headers: { authorization: `Bearer ${admin}` },
      payload: { status: 'PAID' },
    })

    const paid = await simulate(token, intentId, 'PAY')
    expect(paid.statusCode).toBe(200)
    expect(paid.json().status).toBe('SUCCEEDED')
    expect(await orderStatus(token, orderId)).toBe('PAID')
  })
})

describe('transaction soundness (the ALS design proof)', () => {
  it('webhook partial failure rolls back BOTH the intent settle and the order status', async () => {
    const token = await freshCustomer()
    const orderId = await placedOrder(token)
    const intentId = (await createIntent(token, orderId)).json().id as string

    // Rebuild the payments use case with a sabotaged gateway: markPaid
    // throws AFTER the intent-settle statement has already executed.
    const tx = createAmbientTransactions(harness.db)
    const ordering = orderingUseCases(
      cartGatewayAdapter(harness.app.cart),
      catalogGatewayAdapter(harness.app.catalog),
      kyselyOrderRepository(tx),
      tx,
    )
    const realGateway = orderingGatewayAdapter(ordering)
    const sabotaged = paymentsUseCases(
      {
        findOwnedOrder: realGateway.findOwnedOrder,
        markPaid: async () => {
          throw new Error('provider ledger write failed')
        },
      },
      kyselyPaymentIntentRepository(tx),
      { webhookSecret: WEBHOOK_SECRET, mockPspEnabled: true },
      tx,
    )

    const body = JSON.stringify({ eventId: 'boom-1', intentId, type: 'PAYMENT_SUCCEEDED' })
    await expect(sabotaged.handlePspEvent(body, WebhookSignature.sign(WEBHOOK_SECRET, body))).rejects.toThrow(
      'provider ledger write failed',
    )

    // Fresh connections see BOTH unchanged: the settle rolled back with the failure.
    const intent = await inject({
      method: 'GET',
      url: `/payments/intents/${intentId}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(intent.json().status).toBe('CREATED')
    expect(await orderStatus(token, orderId)).toBe('PLACED')
  })

  it('placeOrder atomicity: a failing cart-clear rolls back the stock decrement and the order', async () => {
    const token = await freshCustomer()
    const admin = await adminToken()
    const product = await inject({
      method: 'POST',
      url: '/admin/products',
      headers: { authorization: `Bearer ${admin}` },
      payload: {
        name: `Atomic Herb ${stamp()}`,
        description: 'Atomicity test product.',
        priceMinor: 1000,
        currency: 'EUR',
        stock: 5,
        category: 'HERBS',
      },
    })
    const productId = product.json().id as string
    await inject({
      method: 'PUT',
      url: '/cart/items',
      headers: { authorization: `Bearer ${token}` },
      payload: { productId, quantity: 2 },
    })

    const tx = createAmbientTransactions(harness.db)
    const realCartGateway = cartGatewayAdapter(harness.app.cart)
    const sabotagedOrdering = orderingUseCases(
      {
        linesFor: realCartGateway.linesFor,
        clear: async () => {
          throw new Error('cart clear failed')
        },
      },
      catalogGatewayAdapter(harness.app.catalog),
      kyselyOrderRepository(tx),
      tx,
    )

    const me = await inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${token}` } })
    const userId = me.json().id as string
    await expect(sabotagedOrdering.placeOrder(userId, 2000)).rejects.toThrow('cart clear failed')

    // Stock untouched, no order written, cart intact.
    const prod = await inject({ method: 'GET', url: `/products/${productId}` })
    expect(prod.json().stock).toBe(5)
    const history = await inject({ method: 'GET', url: '/orders', headers: { authorization: `Bearer ${token}` } })
    expect(history.json()).toEqual([])
    const cart = await inject({ method: 'GET', url: '/cart', headers: { authorization: `Bearer ${token}` } })
    expect(cart.json().lines).toHaveLength(1)
  })
})
