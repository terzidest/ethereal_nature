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
const URL_PATTERN = /^https?:\/\/\S+$/

export const MAX_PRODUCT_IMAGES = 8

/** One gallery photo; the label names the shot ("In hand, for scale"). */
export interface ProductImage {
  url: string
  label: string | null
}

/** Optional descriptive copy shown on the product page. */
export interface ProductSpecs {
  summary: string | null
  origin: string | null
  size: string | null
  weight: string | null
}

const SPEC_LIMITS: Record<keyof ProductSpecs, number> = { summary: 300, origin: 100, size: 100, weight: 100 }

/** Blank text means "not set"; anything else is trimmed and length-checked. */
function optionalText(value: string | null, field: string, max: number): string | null {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return null
  domainRequire(trimmed.length <= max, `${field} must be at most ${max} characters`)
  return trimmed
}

export function parseSpecs(specs: ProductSpecs): ProductSpecs {
  return {
    summary: optionalText(specs.summary, 'summary', SPEC_LIMITS.summary),
    origin: optionalText(specs.origin, 'origin', SPEC_LIMITS.origin),
    size: optionalText(specs.size, 'size', SPEC_LIMITS.size),
    weight: optionalText(specs.weight, 'weight', SPEC_LIMITS.weight),
  }
}

export function parseImages(images: readonly ProductImage[]): ProductImage[] {
  domainRequire(images.length <= MAX_PRODUCT_IMAGES, `A product can have at most ${MAX_PRODUCT_IMAGES} images`)
  return images.map((image, i) => {
    const url = image.url.trim()
    domainRequire(url.length <= 500, `Image ${i + 1}: URL must be at most 500 characters`)
    domainRequire(URL_PATTERN.test(url), `Image ${i + 1}: URL must start with http:// or https://`)
    return { url, label: optionalText(image.label, `Image ${i + 1} label`, 100) }
  })
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: Money
  stock: number
  category: ProductCategory
  specs: ProductSpecs
  /** The gallery in display order. */
  images: ProductImage[]
  /** The main photo: always the first image's URL (derived, never set directly). */
  imageUrl: string | null
  archived: boolean
  createdAt: Date
}

export function makeProduct(fields: Omit<Product, 'imageUrl'>): Product {
  domainRequire(fields.name.trim().length > 0, 'Product name cannot be blank')
  domainRequire(SLUG_PATTERN.test(fields.slug), `Invalid slug: ${fields.slug}`)
  parseMoney(fields.price.amountMinor, fields.price.currency)
  parseStock(fields.stock)
  const images = parseImages(fields.images)
  return { ...fields, specs: parseSpecs(fields.specs), images, imageUrl: images[0]?.url ?? null }
}

export interface CategoryCount {
  category: ProductCategory
  productCount: number
}

/** Every category in catalog order; categories nothing was counted for show 0. */
export function categoryCounts(counted: ReadonlyMap<ProductCategory, number>): CategoryCount[] {
  return PRODUCT_CATEGORIES.map((category) => ({ category, productCount: counted.get(category) ?? 0 }))
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
