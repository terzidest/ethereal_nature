/** Fixed locale for deterministic output (hydration + test stability). */
export function formatOrderDate(epochSeconds: number): string {
  return new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(epochSeconds * 1000),
  )
}

export const orderStatusLabels: Record<string, string> = {
  PLACED: 'Placed',
  PAID: 'Paid',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
}
