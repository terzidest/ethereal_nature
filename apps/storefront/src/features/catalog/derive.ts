/**
 * Display-only money formatting. Fixed locale so server and client render
 * identical strings (hydration safety). Never used for authoritative math.
 */
export function formatPrice(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amountMinor / 100)
}

export function categoryLabel(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase()
}

/** A product counts as "New" for this many days after it was added (FE-only rule). */
export const NEW_FOR_DAYS = 30

export function isNewProduct(createdAtEpochSeconds: number, nowMs: number = Date.now()): boolean {
  return nowMs - createdAtEpochSeconds * 1000 < NEW_FOR_DAYS * 24 * 60 * 60 * 1000
}

/** "Only N left" / "Low stock" threshold (redesign-spec §3, FE-only rule). */
export const LOW_STOCK_AT = 10

export const isLowStock = (stock: number) => stock > 0 && stock <= LOW_STOCK_AT
