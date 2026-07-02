import type { ProductCategoryDto, ProductSortDto } from '@ethereal-nature/api-client'

export const CATEGORIES = ['OILS', 'HERBS', 'CRYSTALS', 'TEAS'] as const satisfies readonly ProductCategoryDto[]
export const SORTS = ['newest', 'name', 'price-asc', 'price-desc'] as const satisfies readonly ProductSortDto[]
export const PAGE_SIZES = [10, 25, 50] as const

/** Grid state lives in the URL — a pasted admin link reproduces the exact view. */
export interface ProductsTableSearch {
  page?: number
  pageSize?: number
  category?: ProductCategoryDto
  q?: string
  sort?: ProductSortDto
}

export const pageOf = (s: ProductsTableSearch) => s.page ?? 1
export const pageSizeOf = (s: ProductsTableSearch) => s.pageSize ?? 25
export const sortOf = (s: ProductsTableSearch) => s.sort ?? 'newest'

export function validateProductsTableSearch(input: Record<string, unknown>): ProductsTableSearch {
  const page = Math.max(1, Math.trunc(Number(input.page)) || 1)
  const pageSize = PAGE_SIZES.find((size) => size === Number(input.pageSize))
  const q = typeof input.q === 'string' ? input.q.trim() : ''
  const sort = SORTS.find((s) => s === input.sort)
  return {
    page: page === 1 ? undefined : page,
    pageSize: pageSize === 25 ? undefined : pageSize,
    category: CATEGORIES.find((c) => c === input.category),
    q: q === '' ? undefined : q,
    sort: sort === 'newest' ? undefined : sort,
  }
}
