export { CATEGORIES, SORTS } from './constants'
export { plain } from './text'

export { heroSchema, type HeroProps } from './blocks/hero'
export { categoryTilesSchema, type CategoryTilesProps } from './blocks/category-tiles'
export { productStripSchema, type ProductStripProps } from './blocks/product-strip'
export { valuePropsSchema, type ValuePropsProps } from './blocks/value-props'
export { uspTickerSchema, type UspTickerProps } from './blocks/usp-ticker'
export { newsletterSchema, type NewsletterProps } from './blocks/newsletter'

export { manifest, knownBlockTypes, isKnownBlockType, type KnownBlockType } from './manifest'

// Re-exported from blockprint's React-free entry so consumers (the admin in
// particular) need no direct blockprint dependency.
export { parseConfig, ConfigError, validateConfig } from 'blockprint/config'
export type { BlockConfig, InputOf, OutputOf, ValidatedEntry, ValidationReport } from 'blockprint/config'
