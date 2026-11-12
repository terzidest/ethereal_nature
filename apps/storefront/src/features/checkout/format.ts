import type { OrderStatusDto } from '@ethereal-nature/api-client'

/** Fixed locale for deterministic output (hydration + test stability). */
export function formatOrderDate(epochSeconds: number): string {
  return new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(epochSeconds * 1000),
  )
}

export const orderStatusLabels: Record<OrderStatusDto, string> = {
  PLACED: 'Placed',
  PAID: 'Paid',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  CANCELLED: 'Cancelled',
}

/** Time of day only, e.g. the payment deadline ("14:32"). Fixed locale, like formatOrderDate. */
export function formatOrderTime(epochSeconds: number): string {
  return new Intl.DateTimeFormat('en-IE', { timeStyle: 'short' }).format(new Date(epochSeconds * 1000))
}
