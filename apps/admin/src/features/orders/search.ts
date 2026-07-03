import type { OrderStatusDto } from '@ethereal-nature/api-client'

export const ORDER_STATUSES = ['PLACED', 'PAID', 'PACKED', 'SHIPPED'] as const satisfies readonly OrderStatusDto[]
export const PAGE_SIZES = [10, 25, 50] as const

/** Grid state in the URL — a pasted admin link reproduces the exact view. */
export interface OrdersTableSearch {
  page?: number
  pageSize?: number
  status?: OrderStatusDto
}

export const pageOf = (s: OrdersTableSearch) => s.page ?? 1
export const pageSizeOf = (s: OrdersTableSearch) => s.pageSize ?? 25

export function validateOrdersTableSearch(input: Record<string, unknown>): OrdersTableSearch {
  const page = Math.max(1, Math.trunc(Number(input.page)) || 1)
  const pageSize = PAGE_SIZES.find((size) => size === Number(input.pageSize))
  return {
    page: page === 1 ? undefined : page,
    pageSize: pageSize === 25 ? undefined : pageSize,
    status: ORDER_STATUSES.find((s) => s === input.status),
  }
}
