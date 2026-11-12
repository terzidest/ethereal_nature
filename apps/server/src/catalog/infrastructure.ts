import { sql } from 'kysely'
import type { SelectQueryBuilder } from 'kysely'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import type { DB, ProductsTable } from '../platform/db/types.js'
import { makeProduct, type Product, type ProductCategory, type ProductImage } from './domain.js'
import type { ProductQuery, ProductRepository, ProductSort } from './ports.js'

type ProductRow = Omit<ProductsTable, 'created_at'> & { created_at: Date }

function toProduct(row: ProductRow, images: ProductImage[]): Product {
  return makeProduct({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: { amountMinor: row.price_minor, currency: row.currency },
    stock: row.stock,
    category: row.category as ProductCategory,
    specs: { summary: row.summary, origin: row.origin, size: row.size, weight: row.weight },
    images,
    archived: row.archived,
    createdAt: row.created_at,
  })
}

const ORDERINGS: Record<ProductSort, Array<[col: 'created_at' | 'name' | 'price_minor' | 'id', dir: 'asc' | 'desc']>> = {
  NEWEST: [
    ['created_at', 'desc'],
    ['id', 'asc'],
  ],
  NAME: [
    ['name', 'asc'],
    ['id', 'asc'],
  ],
  PRICE_ASC: [
    ['price_minor', 'asc'],
    ['id', 'asc'],
  ],
  PRICE_DESC: [
    ['price_minor', 'desc'],
    ['id', 'asc'],
  ],
}

export function kyselyProductRepository(tx: AmbientTransactions): ProductRepository {
  const applyFilters = <O>(qb: SelectQueryBuilder<DB, 'products', O>, query: ProductQuery) => {
    let out = qb
    if (!query.includeArchived) out = out.where('archived', '=', false)
    if (query.category) out = out.where('category', '=', query.category)
    const raw = query.search?.trim()
    if (raw) {
      // Strip LIKE metacharacters rather than escaping — parity with the
      // Kotlin repository's defensive search handling.
      const term = raw.replace(/[\\%_]/g, '').toLowerCase()
      if (term) out = out.where(sql<boolean>`lower(name) like ${'%' + term + '%'}`)
    }
    if (query.minPriceMinor !== null) out = out.where('price_minor', '>=', query.minPriceMinor)
    if (query.maxPriceMinor !== null) out = out.where('price_minor', '<=', query.maxPriceMinor)
    return out
  }

  /** Galleries for a set of products in one query, keyed by product id. */
  const imagesFor = async (ids: readonly string[]) => {
    const byProduct = new Map<string, ProductImage[]>()
    if (ids.length === 0) return byProduct
    const rows = await tx
      .getExecutor()
      .selectFrom('product_images')
      .select(['product_id', 'url', 'label'])
      .where('product_id', 'in', ids)
      .orderBy('product_id')
      .orderBy('position')
      .execute()
    for (const row of rows) {
      const list = byProduct.get(row.product_id) ?? []
      list.push({ url: row.url, label: row.label })
      byProduct.set(row.product_id, list)
    }
    return byProduct
  }

  const withImages = async (rows: ProductRow[]) => {
    const images = await imagesFor(rows.map((row) => row.id))
    return rows.map((row) => toProduct(row, images.get(row.id) ?? []))
  }

  /** The gallery is replaced wholesale; runs inside the caller's transaction. */
  const replaceImages = async (product: Product) => {
    const executor = tx.getExecutor()
    await executor.deleteFrom('product_images').where('product_id', '=', product.id).execute()
    if (product.images.length === 0) return
    await executor
      .insertInto('product_images')
      .values(product.images.map((image, position) => ({ product_id: product.id, position, ...image })))
      .execute()
  }

  return {
    async findPage(query) {
      const executor = tx.getExecutor()
      const counted = await applyFilters(
        executor.selectFrom('products').select(sql<number>`count(*)`.as('n')),
        query,
      ).executeTakeFirstOrThrow()

      let page = applyFilters(executor.selectFrom('products').selectAll(), query)
      for (const [col, dir] of ORDERINGS[query.sort]) page = page.orderBy(col, dir)
      const rows = await page
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .execute()

      return { items: await withImages(rows), page: query.page, pageSize: query.pageSize, totalItems: counted.n }
    },

    async findById(id) {
      const row = await tx.getExecutor().selectFrom('products').selectAll().where('id', '=', id).executeTakeFirst()
      return row ? (await withImages([row]))[0]! : null
    },

    async findByIds(ids) {
      if (ids.length === 0) return []
      const rows = await tx.getExecutor().selectFrom('products').selectAll().where('id', 'in', ids).execute()
      return withImages(rows)
    },

    async countActiveByCategory() {
      const rows = await tx
        .getExecutor()
        .selectFrom('products')
        .select(['category', sql<number>`count(*)::int`.as('n')])
        .where('archived', '=', false)
        .groupBy('category')
        .execute()
      return new Map(rows.map((row) => [row.category as ProductCategory, row.n]))
    },

    async decrementStock(id, quantity) {
      const result = await tx
        .getExecutor()
        .updateTable('products')
        .set((eb) => ({ stock: eb('stock', '-', quantity) }))
        .where('id', '=', id)
        .where('stock', '>=', quantity)
        .executeTakeFirst()
      return result.numUpdatedRows === 1n
    },

    async incrementStock(id, quantity) {
      await tx
        .getExecutor()
        .updateTable('products')
        .set((eb) => ({ stock: eb('stock', '+', quantity) }))
        .where('id', '=', id)
        .execute()
    },

    async slugExists(slug) {
      const row = await tx.getExecutor().selectFrom('products').select('id').where('slug', '=', slug).executeTakeFirst()
      return row !== undefined
    },

    async insert(product) {
      await tx
        .getExecutor()
        .insertInto('products')
        .values({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price_minor: product.price.amountMinor,
          currency: product.price.currency,
          stock: product.stock,
          category: product.category,
          image_url: product.imageUrl,
          ...product.specs,
          archived: product.archived,
          created_at: product.createdAt,
        })
        .execute()
      await replaceImages(product)
    },

    async update(product) {
      await tx
        .getExecutor()
        .updateTable('products')
        .set({
          slug: product.slug,
          name: product.name,
          description: product.description,
          price_minor: product.price.amountMinor,
          currency: product.price.currency,
          stock: product.stock,
          category: product.category,
          image_url: product.imageUrl,
          ...product.specs,
          archived: product.archived,
        })
        .where('id', '=', product.id)
        .execute()
      await replaceImages(product)
    },
  }
}
