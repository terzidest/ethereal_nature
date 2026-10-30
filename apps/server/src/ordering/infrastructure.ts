import { sql } from 'kysely'
import type { CartUseCases } from '../cart/use-cases.js'
import type { CatalogUseCases } from '../catalog/use-cases.js'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import { makeOrder, type OrderStatus } from './domain.js'
import type { CartGateway, OrderRepository, ProductCatalogPort } from './use-cases.js'

export function kyselyOrderRepository(tx: AmbientTransactions): OrderRepository {
  async function hydrate(orderRows: Array<{ id: string; user_id: string; status: string; placed_at: Date }>) {
    if (orderRows.length === 0) return []
    const lines = await tx
      .getExecutor()
      .selectFrom('order_lines')
      .selectAll()
      .where(
        'order_id',
        'in',
        orderRows.map((r) => r.id),
      )
      .orderBy('position', 'asc')
      .execute()
    const byOrder = new Map<string, typeof lines>()
    for (const line of lines) {
      const bucket = byOrder.get(line.order_id) ?? []
      bucket.push(line)
      byOrder.set(line.order_id, bucket)
    }
    return orderRows.map((row) =>
      makeOrder({
        id: row.id,
        userId: row.user_id,
        status: row.status as OrderStatus,
        placedAt: row.placed_at,
        lines: (byOrder.get(row.id) ?? []).map((l) => ({
          productId: l.product_id,
          name: l.name,
          quantity: l.quantity,
          unitPriceMinor: l.unit_price_minor,
          currency: l.currency,
        })),
      }),
    )
  }

  return {
    // Immutable by convention and by code path: insert + status-only update.
    async insert(order) {
      const executor = tx.getExecutor()
      await executor
        .insertInto('orders')
        .values({ id: order.id, user_id: order.userId, status: order.status, placed_at: order.placedAt })
        .execute()
      await executor
        .insertInto('order_lines')
        .values(
          order.lines.map((line, index) => ({
            order_id: order.id,
            product_id: line.productId,
            name: line.name,
            quantity: line.quantity,
            unit_price_minor: line.unitPriceMinor,
            currency: line.currency,
            position: index,
          })),
        )
        .execute()
    },

    async findById(id) {
      const row = await tx.getExecutor().selectFrom('orders').selectAll().where('id', '=', id).executeTakeFirst()
      return row ? (await hydrate([row]))[0]! : null
    },

    async findByUser(userId) {
      const rows = await tx
        .getExecutor()
        .selectFrom('orders')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('placed_at', 'desc')
        .execute()
      return hydrate(rows)
    },

    async findPage(page, pageSize, status) {
      const executor = tx.getExecutor()
      let countQb = executor.selectFrom('orders').select(sql<number>`count(*)`.as('n'))
      let pageQb = executor.selectFrom('orders').selectAll()
      if (status) {
        countQb = countQb.where('status', '=', status)
        pageQb = pageQb.where('status', '=', status)
      }
      const counted = await countQb.executeTakeFirstOrThrow()
      const rows = await pageQb
        .orderBy('placed_at', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute()
      return { orders: await hydrate(rows), total: counted.n }
    },

    async updateStatus(id, status) {
      await tx.getExecutor().updateTable('orders').set({ status }).where('id', '=', id).execute()
    },
  }
}

/** In-process adapters onto other contexts' application services (§4.4). */

export function cartGatewayAdapter(cart: CartUseCases): CartGateway {
  return {
    async linesFor(userId) {
      const lines = await cart.getCartLines(userId)
      return lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))
    },
    clear(userId) {
      return cart.clearCart(userId)
    },
  }
}

export function catalogGatewayAdapter(catalog: CatalogUseCases): ProductCatalogPort {
  return {
    async productInfo(ids) {
      const products = await catalog.getProductsByIds(ids)
      return new Map(
        [...products].map(([id, p]) => [
          id,
          {
            name: p.name,
            priceMinor: p.price.amountMinor,
            currency: p.price.currency,
            stock: p.stock,
            archived: p.archived,
          },
        ]),
      )
    },
    decrementStock(intents) {
      return catalog.decrementStock(intents.map((i) => ({ productId: i.productId, quantity: i.quantity })))
    },
  }
}
