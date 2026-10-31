import { AppError, DomainValidationError } from '../platform/errors.js'

/**
 * Content domain — CMS-style page configs. A config is a flat array of block
 * entries consumed by the storefront's blockprint renderer. The server
 * validates STRUCTURE only (mirroring blockprint's parseConfig semantics);
 * per-block prop validation deliberately happens at render time in the
 * storefront — the config is untrusted by design, and the renderer's
 * registry schemas are the real boundary.
 */
export interface BlockEntry {
  type: string
  props?: unknown
  id?: string | number
}

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
  if (!Array.isArray(value)) throw new DomainValidationError('Page config must be an array of blocks')
  return value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new DomainValidationError(`Block ${index} must be an object`)
    }
    const { type, props, id } = entry as Record<string, unknown>
    if (typeof type !== 'string' || type.length === 0) {
      throw new DomainValidationError(`Block ${index} must have a non-empty string type`)
    }
    if (id !== undefined && typeof id !== 'string' && typeof id !== 'number') {
      throw new DomainValidationError(`Block ${index} id must be a string or number`)
    }
    // Strip unknown keys — only type/props/id survive to storage.
    const clean: BlockEntry = { type }
    if (props !== undefined) clean.props = props
    if (id !== undefined) clean.id = id as string | number
    return clean
  })
}
