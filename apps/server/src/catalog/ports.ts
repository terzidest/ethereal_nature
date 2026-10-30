import { domainRequire } from '../platform/errors.js'
import type { Product, ProductCategory } from './domain.js'

export type ProductSort = 'NEWEST' | 'NAME' | 'PRICE_ASC' | 'PRICE_DESC'

export const MAX_PAGE_SIZE = 100

export interface ProductQuery {
  page: number
  pageSize: number
  category: ProductCategory | null
  search: string | null
  sort: ProductSort
  /** Admin listings see archived products; the public catalog never does. */
  includeArchived: boolean
}

export function makeProductQuery(query: ProductQuery): ProductQuery {
  domainRequire(query.page >= 1, 'page must be >= 1')
  domainRequire(query.pageSize >= 1 && query.pageSize <= MAX_PAGE_SIZE, `pageSize must be 1..${MAX_PAGE_SIZE}`)
  return query
}

export interface ProductPage {
  items: Product[]
  page: number
  pageSize: number
  totalItems: number
}

export function totalPages({ totalItems, pageSize }: ProductPage): number {
  return totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
}

/** Port owned by the application layer; the Kysely adapter lives in infrastructure. */
export interface ProductRepository {
  findPage(query: ProductQuery): Promise<ProductPage>
  findById(id: string): Promise<Product | null>
  findByIds(ids: readonly string[]): Promise<Product[]>
  /** Guarded decrement: false when stock is insufficient (no change made). */
  decrementStock(id: string, quantity: number): Promise<boolean>
  slugExists(slug: string): Promise<boolean>
  insert(product: Product): Promise<void>
  update(product: Product): Promise<void>
}

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>
}
