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
