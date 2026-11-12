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

/** "Amethyst Cluster" → ["Amethyst", "Cluster"]: the product page sets everything after the first word in italic. */
export function splitName(name: string): [string, string] {
  const trimmed = name.trim()
  const space = trimmed.indexOf(' ')
  return space === -1 ? [trimmed, ''] : [trimmed.slice(0, space), trimmed.slice(space + 1)]
}

/**
 * Shared-element name for a product's photo: the card's photo and the product
 * page's stage carry the same name, so the browser morphs one into the other
 * on navigation (View Transitions, plan §2.2). Names must be unique on a page,
 * which is why cards only take theirs at the moment they are clicked.
 */
export const productPhotoTransition = (productId: string) => `product-photo-${productId}`
