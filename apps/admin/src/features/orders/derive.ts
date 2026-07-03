import type { OrderStatusDto } from '@ethereal-nature/api-client'

export function formatPrice(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amountMinor / 100)
}

export function formatOrderDate(epochSeconds: number): string {
  return new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(epochSeconds * 1000),
  )
}

export const nextStatus: Record<OrderStatusDto, OrderStatusDto | null> = {
  PLACED: 'PAID',
  PAID: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: null,
}

export const statusTone: Record<OrderStatusDto, string> = {
  PLACED: 'bg-amber-100 text-amber-900',
  PAID: 'bg-blue-100 text-blue-900',
  PACKED: 'bg-purple-100 text-purple-900',
  SHIPPED: 'bg-brand-100 text-brand-900',
}
