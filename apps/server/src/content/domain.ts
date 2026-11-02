import { ConfigError, parseConfig, type BlockConfig } from 'blockprint/config'
import { AppError, DomainValidationError } from '../platform/errors.js'

/**
 * Content domain — CMS-style page configs. A config is a flat array of block
 * entries consumed by the storefront's blockprint renderer. The server
 * validates STRUCTURE only, via blockprint's own React-free parseConfig
 * (`blockprint/config`, zero deps — not a framework import), so write-time
 * and render-time structural rules can never drift. Per-block prop
 * validation deliberately happens at render time in the storefront — the
 * config is untrusted by design, and the renderer's registry schemas are
 * the real boundary.
 */
export type BlockEntry = BlockConfig

export interface Page {
  slug: string
  config: BlockEntry[]
  updatedAt: Date
}

export class PageNotFound extends AppError {
  readonly status = 404
  readonly code = 'PAGE_NOT_FOUND'
  constructor(slug: string) {
    super(`Page ${slug} not found`)
  }
}

export function validatePageConfig(value: unknown): BlockEntry[] {
  try {
    // Strips unknown entry keys; only type/props/id survive to storage.
    return parseConfig(value)
  } catch (error) {
    if (error instanceof ConfigError) throw new DomainValidationError(error.message)
    throw error
  }
}
