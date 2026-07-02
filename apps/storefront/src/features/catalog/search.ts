import type { ProductCategoryDto, ProductSortDto } from '@ethereal-nature/api-client'

export const CATEGORIES = ['OILS', 'HERBS', 'CRYSTALS', 'TEAS'] as const satisfies readonly ProductCategoryDto[]
export const SORTS = ['newest', 'name', 'price-asc', 'price-desc'] as const satisfies readonly ProductSortDto[]

/**
 * All fields optional so defaults stay out of the URL; consumers read via
 * `pageOf`/`sortOf`. A pasted URL always reproduces the exact view.
 */
export interface CatalogSearch {
  page?: number
  category?: ProductCategoryDto
  q?: string
  sort?: ProductSortDto
}

export const pageOf = (search: CatalogSearch) => search.page ?? 1
export const sortOf = (search: CatalogSearch) => search.sort ?? 'newest'

/** Search-param schema for the catalog route: lenient in, canonical out. */
export function validateCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const page = Math.max(1, Math.trunc(Number(input.page)) || 1)
  const q = typeof input.q === 'string' ? input.q.trim() : ''
  const sort = SORTS.find((s) => s === input.sort)
  return {
    page: page === 1 ? undefined : page,
    category: CATEGORIES.find((c) => c === input.category),
    q: q === '' ? undefined : q,
    sort: sort === 'newest' ? undefined : sort,
  }
}
