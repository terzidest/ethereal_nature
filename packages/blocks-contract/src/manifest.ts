import { hero } from './blocks/hero'
import { uspTicker } from './blocks/usp-ticker'
import { categoryTiles } from './blocks/category-tiles'
import { productStrip } from './blocks/product-strip'
import { valueProps } from './blocks/value-props'
import { newsletter } from './blocks/newsletter'

/**
 * The single source of block knowledge (ADR-0011's "blocks-contract" exit):
 * schemas, labels, defaults and summaries, importable WITHOUT components.
 * The storefront joins components to it (`createRegistry(manifest, {...})`);
 * the admin builds its editor from it; tests validate seeds against it.
 *
 * Schemas must evolve additively: new props optional or defaulted, or
 * existing DB configs stop validating. Renaming a type string is breaking.
 */
export const manifest = {
  hero,
  uspTicker,
  categoryTiles,
  productStrip,
  valueProps,
  newsletter,
}

export type KnownBlockType = keyof typeof manifest

export const knownBlockTypes = Object.keys(manifest) as KnownBlockType[]

export const isKnownBlockType = (type: string): type is KnownBlockType =>
  Object.hasOwn(manifest, type)
