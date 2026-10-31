import { domainRequire } from '../platform/errors.js'
import {
  makeCartLine,
  mergeCarts,
  NO_ADJUSTMENTS,
  ProductUnavailable,
  purchasable,
  type Adjustments,
  type CartLine,
  type GuestLine,
  type ProductInfo,
} from './domain.js'

/**
 * Ports owned by the cart application layer. ProductCatalogPort is the
 * cart's whole window onto the catalog (one port subsuming pricing + stock).
 */
export interface ProductCatalogPort {
  productInfo(ids: readonly string[]): Promise<Map<string, ProductInfo>>
}

export interface CartRepository {
  findLines(userId: string): Promise<CartLine[]>
  lastMergeId(userId: string): Promise<string | null>
  /** Rewrites the cart atomically (within the use case's transaction). */
  replace(userId: string, lines: readonly CartLine[], mergeId: string | null): Promise<void>
}

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>
}

/** What the API returns: lines priced fresh from the catalog, never from the client. */
export interface PricedLine {
  productId: string
  name: string
  category: string
  imageUrl: string | null
  quantity: number
  unitPriceMinor: number
  currency: string
  stock: number
  available: boolean
  lineTotalMinor: number
}

export interface CartSnapshot {
  lines: PricedLine[]
  subtotalMinor: number
  currency: string
}

export function snapshotOf(lines: readonly CartLine[], products: ReadonlyMap<string, ProductInfo>): CartSnapshot {
  const priced: PricedLine[] = []
  for (const line of lines) {
    const info = products.get(line.productId)
    if (!info) continue
    const available = purchasable(info)
    priced.push({
      productId: line.productId,
      name: info.name,
      category: info.category,
      imageUrl: info.imageUrl,
      quantity: line.quantity,
      unitPriceMinor: info.priceMinor,
      currency: info.currency,
      stock: info.stock,
      available,
      lineTotalMinor: available ? info.priceMinor * line.quantity : 0,
    })
  }
  return {
    lines: priced,
    subtotalMinor: priced.reduce((sum, l) => sum + l.lineTotalMinor, 0),
    currency: priced[0]?.currency ?? 'EUR',
  }
}

export interface MergeOutcome {
  cart: CartSnapshot
  adjustments: Adjustments
}

export function cartUseCases(carts: CartRepository, catalog: ProductCatalogPort, tx: TransactionRunner) {
  return {
    getCart(userId: string): Promise<CartSnapshot> {
      return tx.run(async () => {
        const lines = await carts.findLines(userId)
        return snapshotOf(lines, await catalog.productInfo(lines.map((l) => l.productId)))
      })
    },

    /**
     * One transaction: read existing cart, snapshot the catalog, run the
     * pure merge, persist. Idempotent via the client-generated mergeId —
     * replaying the same merge returns the current cart with no adjustments
     * instead of doubling quantities (ADR-0007).
     */
    mergeCart(userId: string, guestLines: readonly GuestLine[], mergeId: string): Promise<MergeOutcome> {
      return tx.run(async () => {
        const existing = await carts.findLines(userId)

        if ((await carts.lastMergeId(userId)) === mergeId) {
          return {
            cart: snapshotOf(existing, await catalog.productInfo(existing.map((l) => l.productId))),
            adjustments: NO_ADJUSTMENTS,
          }
        }

        const ids = [...new Set([...existing.map((l) => l.productId), ...guestLines.map((l) => l.productId)])]
        const products = await catalog.productInfo(ids)
        const result = mergeCarts(guestLines, existing, products)

        await carts.replace(userId, result.lines, mergeId)
        return { cart: snapshotOf(result.lines, products), adjustments: result.adjustments }
      })
    },

    /** Sets a line's quantity (0 removes it). Quantity is clamped to stock. */
    setCartItem(userId: string, productId: string, quantity: number): Promise<CartSnapshot> {
      return tx.run(async () => {
        domainRequire(quantity >= 0, 'Quantity cannot be negative')
        const existing = await carts.findLines(userId)

        let newLines: CartLine[]
        if (quantity === 0) {
          newLines = existing.filter((l) => l.productId !== productId)
        } else {
          const info = (await catalog.productInfo([productId])).get(productId)
          if (!info || !purchasable(info)) throw new ProductUnavailable(productId)
          const granted = Math.min(quantity, info.stock)
          newLines = existing.some((l) => l.productId === productId)
            ? existing.map((l) => (l.productId === productId ? makeCartLine(productId, granted) : l))
            : [...existing, makeCartLine(productId, granted)]
        }

        await carts.replace(userId, newLines, null)
        return snapshotOf(newLines, await catalog.productInfo(newLines.map((l) => l.productId)))
      })
    },

    /** Raw intents for other contexts (ordering re-prices itself). No tx — composed by callers. */
    getCartLines(userId: string): Promise<CartLine[]> {
      return carts.findLines(userId)
    },

    /** Empties a user's cart. No tx — composed by the caller. */
    clearCart(userId: string): Promise<void> {
      return carts.replace(userId, [], null)
    },
  }
}

export type CartUseCases = ReturnType<typeof cartUseCases>
