import { sql } from 'kysely'
import type { CatalogUseCases } from '../catalog/use-cases.js'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import { makeCartLine, type ProductInfo } from './domain.js'
import type { CartRepository, ProductCatalogPort } from './use-cases.js'

export function kyselyCartRepository(tx: AmbientTransactions): CartRepository {
  return {
    async findLines(userId) {
      const rows = await tx
        .getExecutor()
        .selectFrom('cart_lines')
        .select(['product_id', 'quantity'])
        .where('user_id', '=', userId)
        .orderBy('position', 'asc')
        .execute()
      return rows.map((r) => makeCartLine(r.product_id, r.quantity))
    },

    async lastMergeId(userId) {
      const row = await tx
        .getExecutor()
        .selectFrom('carts')
        .select('last_merge_id')
        .where('user_id', '=', userId)
        .executeTakeFirst()
      return row?.last_merge_id ?? null
    },

    async replace(userId, lines, mergeId) {
      const executor = tx.getExecutor()
      await executor
        .insertInto('carts')
        .values({ user_id: userId, last_merge_id: mergeId, updated_at: sql`now()` })
        .onConflict((oc) =>
          oc.column('user_id').doUpdateSet({
            updated_at: sql`now()`,
            // mergeId only overwrites when present — a plain set-item never
            // erases merge idempotency state (Kotlin upsert parity).
            ...(mergeId !== null ? { last_merge_id: mergeId } : {}),
          }),
        )
        .execute()
      await executor.deleteFrom('cart_lines').where('user_id', '=', userId).execute()
      if (lines.length > 0) {
        await executor
          .insertInto('cart_lines')
          .values(
            lines.map((line, index) => ({
              user_id: userId,
              product_id: line.productId,
              quantity: line.quantity,
              position: index,
            })),
          )
          .execute()
      }
    },
  }
}

/**
 * In-process adapter onto catalog's application service (ARCHITECTURE §4.4).
 * If catalog ever becomes its own service, only this adapter changes.
 */
export function catalogAdapter(catalog: CatalogUseCases): ProductCatalogPort {
  return {
    async productInfo(ids) {
      const products = await catalog.getProductsByIds(ids)
      const out = new Map<string, ProductInfo>()
      for (const [id, product] of products) {
        out.set(id, {
          name: product.name,
          category: product.category,
          priceMinor: product.price.amountMinor,
          currency: product.price.currency,
          stock: product.stock,
          archived: product.archived,
        })
      }
      return out
    },
  }
}
