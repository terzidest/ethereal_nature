import type { ProductCategoryDto, ProductSortDto } from '@ethereal-nature/api-client'

/**
 * The catalog vocabularies the block schemas enumerate over, checked against
 * the generated contract DTOs so they can never drift from the backend.
 * (The storefront's catalog feature keeps its own copies for catalog search —
 * both are `satisfies`-checked against the same DTO unions.)
 */
export const CATEGORIES = ['OILS', 'HERBS', 'CRYSTALS', 'TEAS'] as const satisfies readonly ProductCategoryDto[]
export const SORTS = ['newest', 'name', 'price-asc', 'price-desc'] as const satisfies readonly ProductSortDto[]
