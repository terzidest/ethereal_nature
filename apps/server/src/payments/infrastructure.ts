import { InvalidStatusTransition, OrderNotFound } from '../ordering/domain.js'
import type { OrderingUseCases } from '../ordering/use-cases.js'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import { makePaymentIntent, type PaymentIntentStatus } from './domain.js'
import type { OrderGateway, PaymentIntentRepository } from './use-cases.js'

export function kyselyPaymentIntentRepository(tx: AmbientTransactions): PaymentIntentRepository {
  return {
    async insert(intent) {
      await tx
        .getExecutor()
        .insertInto('payment_intents')
        .values({
          id: intent.id,
          order_id: intent.orderId,
          user_id: intent.userId,
          amount_minor: intent.amountMinor,
          currency: intent.currency,
          status: intent.status,
          created_at: intent.createdAt,
          settled_event_id: intent.settledEventId,
        })
        .execute()
    },

    async findById(id) {
      const row = await tx
        .getExecutor()
        .selectFrom('payment_intents')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()
      return row ? toIntent(row) : null
    },

    async findOpenByOrder(orderId) {
      const row = await tx
        .getExecutor()
        .selectFrom('payment_intents')
        .selectAll()
        .where('order_id', '=', orderId)
        .where('status', '=', 'CREATED')
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst()
      return row ? toIntent(row) : null
    },

    async settle(id, status, eventId) {
      await tx
        .getExecutor()
        .updateTable('payment_intents')
        .set({ status, settled_event_id: eventId })
        .where('id', '=', id)
        .execute()
    },
  }
}

function toIntent(row: {
  id: string
  order_id: string
  user_id: string
  amount_minor: number
  currency: string
  status: string
  created_at: Date
  settled_event_id: string | null
}) {
  return makePaymentIntent({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    amountMinor: row.amount_minor,
    currency: row.currency,
    status: row.status as PaymentIntentStatus,
    createdAt: row.created_at,
    settledEventId: row.settled_event_id,
  })
}

/** In-process adapter onto ordering's application services (§4.4). */
export function orderingGatewayAdapter(ordering: OrderingUseCases): OrderGateway {
  return {
    async findOwnedOrder(orderId, requesterId) {
      try {
        const order = await ordering.getOrder(orderId, requesterId, false)
        return {
          orderId,
          userId: order.userId,
          totalMinor: order.lines.reduce((s, l) => s + l.unitPriceMinor * l.quantity, 0),
          currency: order.lines[0]!.currency,
          isPlaced: order.status === 'PLACED',
        }
      } catch (error) {
        if (error instanceof OrderNotFound) return null
        throw error
      }
    },

    async markPaid(orderId) {
      try {
        await ordering.transitionOrderStatus(orderId, 'PAID')
      } catch (error) {
        // Already at or past PAID (e.g. an admin advanced it first) — the
        // goal state holds, so a replayed or racing webhook is a no-op.
        if (!(error instanceof InvalidStatusTransition)) throw error
      }
    },
  }
}
