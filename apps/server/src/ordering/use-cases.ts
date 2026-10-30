import { randomUUID } from 'node:crypto'
import {
  canTransitionTo,
  EmptyCart,
  InvalidStatusTransition,
  makeOrder,
  OrderNotFound,
  priceCart,
  pricedTotalMinor,
  type CheckoutIssue,
  type Order,
  type OrderIntent,
  type OrderStatus,
  type ProductInfo,
} from './domain.js'

/** Ports owned by the ordering application layer; adapters live in infrastructure. */

export interface CartGateway {
  linesFor(userId: string): Promise<OrderIntent[]>
  clear(userId: string): Promise<void>
}

export interface ProductCatalogPort {
  productInfo(ids: readonly string[]): Promise<Map<string, ProductInfo>>
  /** Guarded decrements; returns the ids that failed (insufficient stock). */
  decrementStock(intents: readonly OrderIntent[]): Promise<string[]>
}

export interface OrderRepository {
  insert(order: Order): Promise<void>
  findById(id: string): Promise<Order | null>
  findByUser(userId: string): Promise<Order[]>
  findPage(page: number, pageSize: number, status: OrderStatus | null): Promise<{ orders: Order[]; total: number }>
  updateStatus(id: string, status: OrderStatus): Promise<void>
}

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>
}

export type PlaceOrderOutcome =
  | { kind: 'placed'; order: Order }
  /** Final re-validation found changes — surfaced to the user, not silently applied. */
  | { kind: 'rejected'; issues: CheckoutIssue[]; currentTotalMinor: number }

export interface OrderPage {
  items: Order[]
  page: number
  pageSize: number
  totalItems: number
}

export const orderTotalPages = ({ totalItems, pageSize }: OrderPage): number =>
  totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)

export function orderingUseCases(
  cart: CartGateway,
  catalog: ProductCatalogPort,
  orders: OrderRepository,
  tx: TransactionRunner,
) {
  return {
    /**
     * The one atomic transaction of ADR-0007: re-validate price and stock,
     * decrement stock, write the immutable order, empty the cart. Any
     * failure rolls the whole thing back. expectedTotalMinor is what the
     * client showed the user — the client can never dictate a price, only
     * refuse one.
     */
    placeOrder(userId: string, expectedTotalMinor: number): Promise<PlaceOrderOutcome> {
      return tx.run(async () => {
        const intents = await cart.linesFor(userId)
        if (intents.length === 0) throw new EmptyCart()

        const products = await catalog.productInfo(intents.map((i) => i.productId))
        const priced = priceCart(intents, products)

        if (priced.issues.length > 0) {
          return { kind: 'rejected', issues: priced.issues, currentTotalMinor: pricedTotalMinor(priced) }
        }
        if (pricedTotalMinor(priced) !== expectedTotalMinor) {
          return { kind: 'rejected', issues: [], currentTotalMinor: pricedTotalMinor(priced) }
        }

        const failed = await catalog.decrementStock(intents)
        if (failed.length > 0) {
          // Raced another checkout between read and decrement.
          const issues: CheckoutIssue[] = failed.map((id) => {
            const intent = intents.find((i) => i.productId === id)!
            return {
              productId: id,
              name: products.get(id)?.name ?? null,
              kind: 'INSUFFICIENT_STOCK',
              requestedQuantity: intent.quantity,
              availableStock: products.get(id)?.stock ?? 0,
            }
          })
          return { kind: 'rejected', issues, currentTotalMinor: pricedTotalMinor(priced) }
        }

        const order = makeOrder({
          id: randomUUID(),
          userId,
          lines: priced.lines,
          status: 'PLACED',
          placedAt: new Date(),
        })
        await orders.insert(order)
        await cart.clear(userId)
        return { kind: 'placed', order }
      })
    },

    getMyOrders(userId: string): Promise<Order[]> {
      return tx.run(() => orders.findByUser(userId))
    },

    /** Owners see their own orders; back-office roles see any. Others 404, never 403. */
    getOrder(id: string, requesterId: string, canViewAnyOrder: boolean): Promise<Order> {
      return tx.run(async () => {
        const order = await orders.findById(id)
        if (!order) throw new OrderNotFound(id)
        if (!canViewAnyOrder && order.userId !== requesterId) throw new OrderNotFound(id)
        return order
      })
    },

    listOrders(page: number, pageSize: number, status: OrderStatus | null): Promise<OrderPage> {
      return tx.run(async () => {
        const { orders: items, total } = await orders.findPage(page, pageSize, status)
        return { items, page, pageSize, totalItems: total }
      })
    },

    /** The only mutation an order supports: advancing one step in the fulfillment flow. */
    transitionOrderStatus(id: string, target: OrderStatus): Promise<Order> {
      return tx.run(async () => {
        const order = await orders.findById(id)
        if (!order) throw new OrderNotFound(id)
        if (!canTransitionTo(order.status, target)) throw new InvalidStatusTransition(order.status, target)
        await orders.updateStatus(id, target)
        return { ...order, status: target }
      })
    },
  }
}

export type OrderingUseCases = ReturnType<typeof orderingUseCases>
