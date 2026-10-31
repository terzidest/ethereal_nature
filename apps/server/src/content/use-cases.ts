import { PageNotFound, validatePageConfig, type Page } from './domain.js'

/** Ports owned by the content application layer. */

export interface PageRepository {
  findBySlug(slug: string): Promise<Page | null>
  findAll(): Promise<Array<Pick<Page, 'slug' | 'updatedAt'>>>
  /** Replaces the config of an existing page; false when the slug is unknown. */
  updateConfig(slug: string, config: unknown): Promise<boolean>
}

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>
}

export function contentUseCases(pages: PageRepository, tx: TransactionRunner) {
  return {
    async getPage(slug: string): Promise<Page> {
      const page = await tx.run(() => pages.findBySlug(slug))
      if (!page) throw new PageNotFound(slug)
      return page
    },

    listPages(): Promise<Array<Pick<Page, 'slug' | 'updatedAt'>>> {
      return tx.run(() => pages.findAll())
    },

    /**
     * Save = live (v1): a structurally valid config replaces the page's
     * config immediately. Pages are created by migration/seed only — an
     * unknown slug is a 404, not an upsert.
     */
    async updatePage(slug: string, config: unknown): Promise<Page> {
      const validated = validatePageConfig(config)
      return tx.run(async () => {
        const updated = await pages.updateConfig(slug, validated)
        if (!updated) throw new PageNotFound(slug)
        return (await pages.findBySlug(slug))!
      })
    },
  }
}

export type ContentUseCases = ReturnType<typeof contentUseCases>
