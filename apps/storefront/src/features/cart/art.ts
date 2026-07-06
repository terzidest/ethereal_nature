import type { ArtCategory } from '@ethereal-nature/ui'

const known = new Set<string>(['OILS', 'HERBS', 'CRYSTALS', 'TEAS'])

/** Coerce API/persisted category strings to an art category, safely. */
export function artCategory(category: string | undefined): ArtCategory {
  return (known.has(category ?? '') ? category : 'HERBS') as ArtCategory
}
