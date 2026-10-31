import { sql } from 'kysely'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import type { BlockEntry, Page } from './domain.js'
import type { PageRepository } from './use-cases.js'

export function kyselyPageRepository(tx: AmbientTransactions): PageRepository {
  return {
    async findBySlug(slug) {
      const row = await tx.getExecutor().selectFrom('pages').selectAll().where('slug', '=', slug).executeTakeFirst()
      // pg parses jsonb to JS values on read.
      return row ? ({ slug: row.slug, config: row.config as BlockEntry[], updatedAt: row.updated_at } satisfies Page) : null
    },

    async findAll() {
      const rows = await tx
        .getExecutor()
        .selectFrom('pages')
        .select(['slug', 'updated_at'])
        .orderBy('slug')
        .execute()
      return rows.map((r) => ({ slug: r.slug, updatedAt: r.updated_at }))
    },

    async updateConfig(slug, config) {
      const result = await tx
        .getExecutor()
        .updateTable('pages')
        .set({ config: sql`${JSON.stringify(config)}::jsonb`, updated_at: sql`now()` })
        .where('slug', '=', slug)
        .executeTakeFirst()
      return result.numUpdatedRows === 1n
    },
  }
}
