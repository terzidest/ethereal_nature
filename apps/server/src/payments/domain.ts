import { createHmac, timingSafeEqual } from 'node:crypto'
import { AppError, domainRequire } from '../platform/errors.js'

/** CREATED is the only open state; settling to SUCCEEDED or FAILED is the only transition. */
export type PaymentIntentStatus = 'CREATED' | 'SUCCEEDED' | 'FAILED'

export const isTerminal = (status: PaymentIntentStatus): boolean => status !== 'CREATED'

/**
 * One attempt to pay one order. Amount and currency are copied from the order
 * server-side at creation — never client-supplied. Terminal intents are
 * frozen; retrying a failed payment means creating a new intent.
 */
export interface PaymentIntent {
  id: string
  orderId: string
  userId: string
  amountMinor: number
  currency: string
  status: PaymentIntentStatus
  createdAt: Date
  settledEventId: string | null
}

export function makePaymentIntent(intent: PaymentIntent): PaymentIntent {
  domainRequire(intent.amountMinor >= 0, 'Payment amount cannot be negative')
  domainRequire(intent.currency.length === 3, 'Currency must be a 3-letter code')
  return intent
}

export function settle(intent: PaymentIntent, target: PaymentIntentStatus, eventId: string): PaymentIntent {
  domainRequire(!isTerminal(intent.status), `Payment intent ${intent.id} is already settled`)
  domainRequire(isTerminal(target), 'Settling must reach a terminal status')
  return { ...intent, status: target, settledEventId: eventId }
}

/** HMAC-SHA256 over the raw webhook body, lowercase hex — pure node:crypto. */
export const WebhookSignature = {
  sign(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
  },
  verify(secret: string, payload: string, signatureHex: string | null | undefined): boolean {
    if (!signatureHex || signatureHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(signatureHex)) return false
    const expected = createHmac('sha256', secret).update(payload, 'utf8').digest()
    const provided = Buffer.from(signatureHex, 'hex')
    // timingSafeEqual demands equal lengths; a wrong-length signature can
    // fail fast — the length itself is not secret.
    if (provided.length !== expected.length) return false
    return timingSafeEqual(expected, provided)
  },
}

/** Sealed domain errors — mapped to HTTP exactly once, by the platform handler. */
export class IntentNotFound extends AppError {
  readonly status = 404
  readonly code = 'PAYMENT_INTENT_NOT_FOUND'
  constructor(id: string) {
    super(`Payment intent ${id} not found`)
  }
}

export class PayableOrderNotFound extends AppError {
  readonly status = 404
  readonly code = 'ORDER_NOT_FOUND'
  constructor(orderId: string) {
    super(`Order ${orderId} not found`)
  }
}

export class OrderNotPayable extends AppError {
  readonly status = 409
  readonly code = 'ORDER_NOT_PAYABLE'
  constructor(orderId: string) {
    super(`Order ${orderId} is not awaiting payment`)
  }
}

export class InvalidWebhookSignature extends AppError {
  readonly status = 401
  readonly code = 'INVALID_WEBHOOK_SIGNATURE'
  constructor() {
    super('Webhook signature missing or invalid')
  }
}

export class MalformedWebhookEvent extends AppError {
  readonly status = 400
  readonly code = 'MALFORMED_WEBHOOK_EVENT'
  constructor(detail: string) {
    super(`Malformed webhook event: ${detail}`)
  }
}
