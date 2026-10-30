import { AppError, domainRequire } from '../platform/errors.js'

/** Catalog domain — pure. Invariants enforced at construction (value-class mirror). */
export type ProductCategory = 'OILS' | 'HERBS' | 'CRYSTALS' | 'TEAS'
export const PRODUCT_CATEGORIES: readonly ProductCategory[] = ['OILS', 'HERBS', 'CRYSTALS', 'TEAS']

export interface Money {
  amountMinor: number
  currency: string
}

/** Money in minor units (cents). Never negative, never floating point. */
export function parseMoney(amountMinor: number, currency: string): Money {
  domainRequire(Number.isInteger(amountMinor) && amountMinor >= 0, `Money cannot be negative: ${amountMinor}`)
  domainRequire(/^[A-Z]{3}$/.test(currency), `Invalid currency code: ${currency}`)
  return { amountMinor, currency }
}

export function parseStock(quantity: number): number {
  domainRequire(Number.isInteger(quantity) && quantity >= 0, `Stock cannot be negative: ${quantity}`)
  return quantity
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: Money
  stock: number
  category: ProductCategory
  imageUrl: string | null
  archived: boolean
}

export function makeProduct(fields: Product): Product {
  domainRequire(fields.name.trim().length > 0, 'Product name cannot be blank')
  domainRequire(SLUG_PATTERN.test(fields.slug), `Invalid slug: ${fields.slug}`)
  parseMoney(fields.price.amountMinor, fields.price.currency)
  parseStock(fields.stock)
  return fields
}

export class ProductNotFound extends AppError {
  readonly status = 404
  readonly code = 'PRODUCT_NOT_FOUND'
  constructor(id: string) {
    super(`Product ${id} not found`)
  }
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
  return slug === '' ? 'product' : slug
}
