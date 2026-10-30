import { randomUUID } from 'node:crypto'
import {
  IntentNotFound,
  InvalidWebhookSignature,
  isTerminal,
  makePaymentIntent,
  MalformedWebhookEvent,
  OrderNotPayable,
  PayableOrderNotFound,
  settle,
  WebhookSignature,
  type PaymentIntent,
  type PaymentIntentStatus,
} from './domain.js'

/** Ports owned by the payments application layer. */

/** The slice of an order that payments needs — payments' own vocabulary. */
export interface PayableOrder {
  orderId: string
  userId: string
  totalMinor: number
  currency: string
  isPlaced: boolean
}

export interface OrderGateway {
  /** null when the order doesn't exist or isn't the requester's — the caller 404s either way. */
  findOwnedOrder(orderId: string, requesterId: string): Promise<PayableOrder | null>
  /** Idempotent: an order already at or past PAID is left untouched. */
  markPaid(orderId: string): Promise<void>
}

export interface PaymentIntentRepository {
  insert(intent: PaymentIntent): Promise<void>
  findById(id: string): Promise<PaymentIntent | null>
  findOpenByOrder(orderId: string): Promise<PaymentIntent | null>
  settle(id: string, status: PaymentIntentStatus, eventId: string): Promise<void>
}

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>
}

export interface PaymentsSettings {
  webhookSecret: string
  mockPspEnabled: boolean
}

export type CreateIntentOutcome = { kind: 'created' | 'existing'; intent: PaymentIntent }

export type PspEventType = 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED'

export interface PspEvent {
  eventId: string
  intentId: string
  type: PspEventType
}

export type WebhookOutcome = 'processed' | 'already_processed'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function paymentsUseCases(
  orders: OrderGateway,
  intents: PaymentIntentRepository,
  settings: PaymentsSettings,
  tx: TransactionRunner,
) {
  return {
    /**
     * Idempotent for open intents: a second call for the same order returns
     * the existing CREATED intent instead of minting a duplicate (a partial
     * unique index backs this at the DB level). Amount is copied from the order.
     */
    createPaymentIntent(orderId: string, userId: string): Promise<CreateIntentOutcome> {
      return tx.run(async () => {
        const order = await orders.findOwnedOrder(orderId, userId)
        if (!order) throw new PayableOrderNotFound(orderId)
        if (!order.isPlaced) throw new OrderNotPayable(orderId)
        const existing = await intents.findOpenByOrder(orderId)
        if (existing) return { kind: 'existing', intent: existing }
        const intent = makePaymentIntent({
          id: randomUUID(),
          orderId,
          userId,
          amountMinor: order.totalMinor,
          currency: order.currency,
          status: 'CREATED',
          createdAt: new Date(),
          settledEventId: null,
        })
        await intents.insert(intent)
        return { kind: 'created', intent }
      })
    },

    /** Owner-only; anyone else gets the same 404 as a missing intent — no id probing. */
    getPaymentIntent(id: string, requesterId: string): Promise<PaymentIntent> {
      return tx.run(async () => {
        const intent = await intents.findById(id)
        if (!intent || intent.userId !== requesterId) throw new IntentNotFound(id)
        return intent
      })
    },

    /**
     * Webhook entry: verify the signature over the RAW body before parsing.
     * One payments transaction wraps both writes; ordering's markPaid joins
     * it through the shared ambient runner, so intent and order settle or
     * roll back together. Replays are answered by intent status: a terminal
     * intent is a 200 no-op.
     */
    handlePspEvent(rawBody: string, signatureHex: string | null | undefined): Promise<WebhookOutcome> {
      if (!WebhookSignature.verify(settings.webhookSecret, rawBody, signatureHex)) {
        throw new InvalidWebhookSignature()
      }
      let event: PspEvent
      try {
        const parsed = JSON.parse(rawBody) as Partial<PspEvent>
        if (
          typeof parsed.eventId !== 'string' ||
          typeof parsed.intentId !== 'string' ||
          (parsed.type !== 'PAYMENT_SUCCEEDED' && parsed.type !== 'PAYMENT_FAILED')
        ) {
          throw new Error('missing or invalid fields')
        }
        event = parsed as PspEvent
      } catch (error) {
        throw new MalformedWebhookEvent((error as Error).message || 'unparseable body')
      }
      if (!UUID_PATTERN.test(event.intentId)) throw new MalformedWebhookEvent('intentId is not a UUID')

      return tx.run(async () => {
        const intent = await intents.findById(event.intentId.toLowerCase())
        if (!intent) throw new IntentNotFound(event.intentId)
        if (isTerminal(intent.status)) return 'already_processed'
        const target: PaymentIntentStatus = event.type === 'PAYMENT_SUCCEEDED' ? 'SUCCEEDED' : 'FAILED'
        const settled = settle(intent, target, event.eventId)
        await intents.settle(settled.id, settled.status, event.eventId)
        if (settled.status === 'SUCCEEDED') await orders.markPaid(intent.orderId)
        return 'processed'
      })
    },
  }
}

export type PaymentsUseCases = ReturnType<typeof paymentsUseCases>
