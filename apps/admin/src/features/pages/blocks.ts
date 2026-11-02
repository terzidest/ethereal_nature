import type { ProductCategoryDto, ProductSortDto } from '@ethereal-nature/api-client'

/**
 * Admin-local shapes of the storefront's block props. v1 accepts this small
 * duplication (4 blocks) over a shared schema package; the storefront's
 * seed↔registry test plus the server's structural validation keep drift
 * visible. Shapes must mirror apps/storefront/src/features/pages/blocks/*.
 */

export const CATEGORIES = ['OILS', 'HERBS', 'CRYSTALS', 'TEAS'] as const satisfies readonly ProductCategoryDto[]
export const SORTS = ['newest', 'name', 'price-asc', 'price-desc'] as const satisfies readonly ProductSortDto[]

export interface HeroProps {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: { label: string }
  secondaryCta: { label: string; sort?: ProductSortDto }
}

export interface CategoryTilesProps {
  heading: string
  tiles: Array<{ category: ProductCategoryDto; label: string; blurb: string }>
}

export interface ProductStripProps {
  title: string
  category?: ProductCategoryDto
  sort?: ProductSortDto
  limit?: number
}

export interface ValuePropsProps {
  items: Array<{ title: string; blurb: string }>
}

export interface KnownBlockProps {
  hero: HeroProps
  categoryTiles: CategoryTilesProps
  productStrip: ProductStripProps
  valueProps: ValuePropsProps
}

export type KnownBlockType = keyof KnownBlockProps

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const asString = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback)

const asCategory = (value: unknown): ProductCategoryDto | undefined =>
  CATEGORIES.find((c) => c === value)

const asSort = (value: unknown): ProductSortDto | undefined => SORTS.find((s) => s === value)

/**
 * Per-type: display label, defaults for newly added blocks, a one-line card
 * summary, and a normalizer that turns untrusted server props into the typed
 * shape the editor form binds to (missing fields fall back to defaults —
 * additive schema evolution then shows the default instead of crashing).
 */
export const BLOCKS: {
  [T in KnownBlockType]: {
    label: string
    defaults: KnownBlockProps[T]
    summary: (props: KnownBlockProps[T]) => string
    normalize: (props: unknown) => KnownBlockProps[T]
  }
} = {
  hero: {
    label: 'Hero',
    defaults: {
      eyebrow: 'New season harvest',
      title: 'A headline for the shop.',
      subtitle: 'A sentence that sets the mood.',
      primaryCta: { label: 'Shop everything' },
      secondaryCta: { label: 'Under €15', sort: 'price-asc' },
    },
    summary: (props) => props.title,
    normalize: (props) => {
      const p = asRecord(props)
      const d = BLOCKS.hero.defaults
      const primary = asRecord(p.primaryCta)
      const secondary = asRecord(p.secondaryCta)
      return {
        eyebrow: asString(p.eyebrow, d.eyebrow),
        title: asString(p.title, d.title),
        subtitle: asString(p.subtitle, d.subtitle),
        primaryCta: { label: asString(primary.label, d.primaryCta.label) },
        secondaryCta: { label: asString(secondary.label, d.secondaryCta.label), sort: asSort(secondary.sort) },
      }
    },
  },
  categoryTiles: {
    label: 'Category tiles',
    defaults: {
      heading: 'Shop by category',
      tiles: [
        { category: 'OILS', label: 'Essential oils', blurb: 'Steam-distilled, single-origin' },
        { category: 'HERBS', label: 'Herbs', blurb: 'Dried whole, small harvests' },
        { category: 'CRYSTALS', label: 'Crystals', blurb: 'Hand-picked specimens' },
        { category: 'TEAS', label: 'Teas', blurb: 'Loose leaf, honest blends' },
      ],
    },
    summary: (props) => `${props.heading} · ${props.tiles.length} tiles`,
    normalize: (props) => {
      const p = asRecord(props)
      const d = BLOCKS.categoryTiles.defaults
      const tiles = Array.isArray(p.tiles)
        ? p.tiles.map((tile) => {
            const t = asRecord(tile)
            return { category: asCategory(t.category) ?? 'HERBS', label: asString(t.label, ''), blurb: asString(t.blurb, '') }
          })
        : d.tiles
      return { heading: asString(p.heading, d.heading), tiles }
    },
  },
  productStrip: {
    label: 'Product strip',
    defaults: { title: 'New arrivals', sort: 'newest', limit: 4 },
    summary: (props) => `${props.title} · ${props.category ?? 'all categories'} · ${props.limit ?? 4} products`,
    normalize: (props) => {
      const p = asRecord(props)
      const d = BLOCKS.productStrip.defaults
      const limit = Number(p.limit)
      return {
        title: asString(p.title, d.title),
        category: asCategory(p.category),
        sort: asSort(p.sort) ?? 'newest',
        limit: Number.isInteger(limit) && limit >= 1 && limit <= 12 ? limit : 4,
      }
    },
  },
  valueProps: {
    label: 'Value props',
    defaults: {
      items: [
        { title: 'Sourced with care', blurb: 'Every grower and cutter is someone we know by name.' },
        { title: 'Small batches', blurb: 'Short runs, fresh stock — nothing sits in a warehouse for years.' },
        { title: 'Plastic-free post', blurb: 'Recycled boxes, paper tape, no fillers.' },
      ],
    },
    summary: (props) => props.items.map((item) => item.title).join(' · '),
    normalize: (props) => {
      const p = asRecord(props)
      const d = BLOCKS.valueProps.defaults
      const items = Array.isArray(p.items)
        ? p.items.map((item) => {
            const i = asRecord(item)
            return { title: asString(i.title, ''), blurb: asString(i.blurb, '') }
          })
        : d.items
      return { items }
    },
  },
}

export const KNOWN_BLOCK_TYPES = Object.keys(BLOCKS) as KnownBlockType[]

export const isKnownBlockType = (type: string): type is KnownBlockType => type in BLOCKS
