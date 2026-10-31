import { AppError, domainRequire } from '../platform/errors.js'

/**
 * The cart context speaks about products only by id — it never imports
 * catalog domain types. What it needs to know arrives as a ProductInfo
 * snapshot through its own port.
 */

export interface CartLine {
  productId: string
  quantity: number
}

export function makeCartLine(productId: string, quantity: number): CartLine {
  domainRequire(quantity > 0, 'Cart line quantity must be positive')
  return { productId, quantity }
}

/** A guest intent from the client. The snapshot is display-provenance only. */
export interface GuestLine {
  productId: string
  quantity: number
  priceSnapshotMinor: number | null
}

export function makeGuestLine(productId: string, quantity: number, priceSnapshotMinor: number | null): GuestLine {
  domainRequire(quantity > 0, 'Guest line quantity must be positive')
  return { productId, quantity, priceSnapshotMinor }
}

/** Catalog snapshot the merge works against — plain data, no IO. */
export interface ProductInfo {
  name: string
  category: string
  imageUrl: string | null
  priceMinor: number
  currency: string
  stock: number
  archived: boolean
}

export const purchasable = (info: ProductInfo): boolean => !info.archived && info.stock > 0

export class ProductUnavailable extends AppError {
  readonly status = 409
  readonly code = 'PRODUCT_UNAVAILABLE'
  constructor(productId: string) {
    super(`Product ${productId} is not available`)
  }
}

export type DropReason = 'NOT_FOUND' | 'ARCHIVED' | 'OUT_OF_STOCK'

export interface Adjustments {
  dropped: Array<{ productId: string; reason: DropReason }>
  clamped: Array<{ productId: string; requestedQuantity: number; grantedQuantity: number }>
  priceChanged: Array<{ productId: string; snapshotPriceMinor: number; currentPriceMinor: number }>
}

export const NO_ADJUSTMENTS: Adjustments = { dropped: [], clamped: [], priceChanged: [] }

export interface MergeResult {
  lines: CartLine[]
  adjustments: Adjustments
}

/**
 * Pure merge of a guest cart into an existing user cart (ADR-0007).
 *
 * Policy: duplicates sum then clamp to stock; unknown/archived/out-of-stock
 * drop with a reason; existing lines are re-validated too; price changes are
 * reported for surviving guest lines whose display snapshot drifted — the
 * snapshot is never used for math. Empty guest cart → no-op merge.
 */
export function mergeCarts(
  guestLines: readonly GuestLine[],
  existingLines: readonly CartLine[],
  products: ReadonlyMap<string, ProductInfo>,
): MergeResult {
  // Preserve order: existing lines first, then new guest products.
  const requested = new Map<string, number>()
  for (const line of existingLines) requested.set(line.productId, (requested.get(line.productId) ?? 0) + line.quantity)
  for (const line of guestLines) requested.set(line.productId, (requested.get(line.productId) ?? 0) + line.quantity)

  const guestSnapshots = new Map(
    guestLines.filter((l) => l.priceSnapshotMinor !== null).map((l) => [l.productId, l.priceSnapshotMinor!]),
  )

  const result: MergeResult = { lines: [], adjustments: { dropped: [], clamped: [], priceChanged: [] } }
  const { dropped, clamped, priceChanged } = result.adjustments

  for (const [productId, requestedQuantity] of requested) {
    const info = products.get(productId)
    if (!info) {
      dropped.push({ productId, reason: 'NOT_FOUND' })
    } else if (info.archived) {
      dropped.push({ productId, reason: 'ARCHIVED' })
    } else if (info.stock === 0) {
      dropped.push({ productId, reason: 'OUT_OF_STOCK' })
    } else {
      const granted = Math.min(requestedQuantity, info.stock)
      if (granted < requestedQuantity) clamped.push({ productId, requestedQuantity, grantedQuantity: granted })
      const snapshot = guestSnapshots.get(productId)
      if (snapshot !== undefined && snapshot !== info.priceMinor) {
        priceChanged.push({ productId, snapshotPriceMinor: snapshot, currentPriceMinor: info.priceMinor })
      }
      result.lines.push(makeCartLine(productId, granted))
    }
  }

  return result
}
