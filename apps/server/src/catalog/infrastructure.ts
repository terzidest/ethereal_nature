import { sql } from 'kysely'
import type { SelectQueryBuilder } from 'kysely'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import type { DB, ProductsTable } from '../platform/db/types.js'
import { makeProduct, type Product, type ProductCategory } from './domain.js'
import type { ProductQuery, ProductRepository, ProductSort } from './ports.js'

type ProductRow = Omit<ProductsTable, 'created_at'> & { created_at?: Date }

function toProduct(row: ProductRow): Product {
  return makeProduct({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: { amountMinor: row.price_minor, currency: row.currency },
    stock: row.stock,
    category: row.category as ProductCategory,
    imageUrl: row.image_url,
    archived: row.archived,
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
    return out
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

      return { items: rows.map(toProduct), page: query.page, pageSize: query.pageSize, totalItems: counted.n }
    },

    async findById(id) {
      const row = await tx.getExecutor().selectFrom('products').selectAll().where('id', '=', id).executeTakeFirst()
      return row ? toProduct(row) : null
    },

    async findByIds(ids) {
      if (ids.length === 0) return []
      const rows = await tx.getExecutor().selectFrom('products').selectAll().where('id', 'in', ids).execute()
      return rows.map(toProduct)
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
          archived: product.archived,
        })
        .execute()
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
          archived: product.archived,
        })
        .where('id', '=', product.id)
        .execute()
    },
  }
}
