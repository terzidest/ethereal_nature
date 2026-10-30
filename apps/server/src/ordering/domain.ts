import { AppError, domainRequire } from '../platform/errors.js'

/** Ordering domain — pure. */

export type OrderStatus = 'PLACED' | 'PAID' | 'PACKED' | 'SHIPPED'
export const ORDER_STATUSES: readonly OrderStatus[] = ['PLACED', 'PAID', 'PACKED', 'SHIPPED']

/** Linear fulfillment flow — the only mutation an order ever sees. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return ORDER_STATUSES[ORDER_STATUSES.indexOf(status) + 1] ?? null
}

export function canTransitionTo(from: OrderStatus, target: OrderStatus): boolean {
  return target === nextStatus(from)
}

/** A frozen snapshot line. Name and price are copied at placement. */
export interface OrderLine {
  productId: string
  name: string
  quantity: number
  unitPriceMinor: number
  currency: string
}

export function makeOrderLine(line: OrderLine): OrderLine {
  domainRequire(line.quantity > 0, 'Order line quantity must be positive')
  domainRequire(line.unitPriceMinor >= 0, 'Order line price cannot be negative')
  return line
}

export const lineTotalMinor = (line: OrderLine): number => line.unitPriceMinor * line.quantity

/** Immutable aggregate: no line edits, only status advance. */
export interface Order {
  id: string
  userId: string
  lines: OrderLine[]
  status: OrderStatus
  placedAt: Date
}

export function makeOrder(order: Order): Order {
  domainRequire(order.lines.length > 0, 'An order must have at least one line')
  order.lines.forEach(makeOrderLine)
  return order
}

export const orderTotalMinor = (order: Order): number => order.lines.reduce((s, l) => s + lineTotalMinor(l), 0)
export const orderCurrency = (order: Order): string => order.lines[0]!.currency

/** Sealed domain errors — mapped to HTTP exactly once, by the platform handler. */
export class EmptyCart extends AppError {
  readonly status = 400
  readonly code = 'EMPTY_CART'
  constructor() {
    super('Cannot place an order from an empty cart')
  }
}

export class OrderNotFound extends AppError {
  readonly status = 404
  readonly code = 'ORDER_NOT_FOUND'
  constructor(id: string) {
    super(`Order ${id} not found`)
  }
}

export class InvalidStatusTransition extends AppError {
  readonly status = 409
  readonly code = 'INVALID_STATUS_TRANSITION'
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order from ${from} to ${to}`)
  }
}

/** What ordering wants from the cart: intents only. */
export interface OrderIntent {
  productId: string
  quantity: number
}

/** Catalog snapshot — ordering's own vocabulary, no catalog imports. */
export interface ProductInfo {
  name: string
  priceMinor: number
  currency: string
  stock: number
  archived: boolean
}

export type IssueKind = 'UNAVAILABLE' | 'INSUFFICIENT_STOCK'

export interface CheckoutIssue {
  productId: string
  name: string | null
  kind: IssueKind
  requestedQuantity: number
  availableStock: number
}

export interface PricedCart {
  lines: OrderLine[]
  issues: CheckoutIssue[]
}

export const pricedTotalMinor = (priced: PricedCart): number => priced.lines.reduce((s, l) => s + lineTotalMinor(l), 0)
export const isPlaceable = (priced: PricedCart): boolean => priced.issues.length === 0 && priced.lines.length > 0

/**
 * Pure final re-validation before an order is written (ADR-0007). Prices come
 * exclusively from the catalog snapshot; anything unavailable or short on
 * stock becomes a blocking issue — checkout never silently clamps the way
 * merge does.
 */
export function priceCart(intents: readonly OrderIntent[], products: ReadonlyMap<string, ProductInfo>): PricedCart {
  const lines: OrderLine[] = []
  const issues: CheckoutIssue[] = []

  for (const intent of intents) {
    const info = products.get(intent.productId)
    if (!info || info.archived) {
      issues.push({
        productId: intent.productId,
        name: info?.name ?? null,
        kind: 'UNAVAILABLE',
        requestedQuantity: intent.quantity,
        availableStock: 0,
      })
    } else if (info.stock < intent.quantity) {
      issues.push({
        productId: intent.productId,
        name: info.name,
        kind: 'INSUFFICIENT_STOCK',
        requestedQuantity: intent.quantity,
        availableStock: info.stock,
      })
    } else {
      lines.push(
        makeOrderLine({
          productId: intent.productId,
          name: info.name,
          quantity: intent.quantity,
          unitPriceMinor: info.priceMinor,
          currency: info.currency,
        }),
      )
    }
  }
  return { lines, issues }
}
