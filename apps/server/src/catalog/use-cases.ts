import { randomUUID } from 'node:crypto'
import {
  makeProduct,
  parseMoney,
  parseStock,
  ProductNotFound,
  slugify,
  type Product,
  type ProductCategory,
} from './domain.js'
import type { ProductPage, ProductQuery, ProductRepository, TransactionRunner } from './ports.js'

/**
 * Admin write input. Validation happens by constructing domain value
 * objects — invalid input can't produce a Product at all.
 */
export interface ProductInput {
  name: string
  description: string
  priceMinor: number
  currency: string
  stock: number
  category: ProductCategory
  imageUrl: string | null
}

export interface StockDecrement {
  productId: string
  quantity: number
}

export function catalogUseCases(products: ProductRepository, tx: TransactionRunner) {
  return {
    listProducts(query: ProductQuery): Promise<ProductPage> {
      return tx.run(() => products.findPage(query))
    },

    async getProduct(id: string): Promise<Product> {
      const product = await tx.run(() => products.findById(id))
      if (!product) throw new ProductNotFound(id)
      return product
    },

    async createProduct(input: ProductInput): Promise<Product> {
      return tx.run(async () => {
        // Slug derives from the name once, at creation, then never changes —
        // product URLs stay stable through renames.
        const base = slugify(input.name)
        let slug = base
        let attempt = 2
        while (await products.slugExists(slug)) {
          slug = `${base}-${attempt++}`
        }
        const product = makeProduct({
          id: randomUUID(),
          slug,
          name: input.name,
          description: input.description,
          price: parseMoney(input.priceMinor, input.currency),
          stock: parseStock(input.stock),
          category: input.category,
          imageUrl: input.imageUrl,
          archived: false,
        })
        await products.insert(product)
        return product
      })
    },

    async updateProduct(id: string, input: ProductInput): Promise<Product> {
      return tx.run(async () => {
        const existing = await products.findById(id)
        if (!existing) throw new ProductNotFound(id)
        const updated = makeProduct({
          ...existing,
          name: input.name,
          description: input.description,
          price: parseMoney(input.priceMinor, input.currency),
          stock: parseStock(input.stock),
          category: input.category,
          imageUrl: input.imageUrl,
        })
        await products.update(updated)
        return updated
      })
    },

    async setProductArchived(id: string, archived: boolean): Promise<Product> {
      return tx.run(async () => {
        const existing = await products.findById(id)
        if (!existing) throw new ProductNotFound(id)
        const updated = { ...existing, archived }
        await products.update(updated)
        return updated
      })
    },

    /**
     * Application service other contexts consume through their own ports.
     * Missing ids are simply absent from the result. No transaction of its
     * own: composed inside the caller's use-case transaction.
     */
    async getProductsByIds(ids: readonly string[]): Promise<Map<string, Product>> {
      if (ids.length === 0) return new Map()
      const found = await products.findByIds(ids)
      return new Map(found.map((p) => [p.id, p]))
    },

    /**
     * Atomically decrements stock; returns ids whose decrement failed
     * (insufficient stock at write time — checkout's race guard). No
     * transaction of its own: joins the caller's.
     */
    async decrementStock(items: readonly StockDecrement[]): Promise<string[]> {
      const failed: string[] = []
      for (const item of items) {
        if (!(await products.decrementStock(item.productId, item.quantity))) failed.push(item.productId)
      }
      return failed
    },
  }
}

export type CatalogUseCases = ReturnType<typeof catalogUseCases>
