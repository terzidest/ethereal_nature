import { createRegistry } from 'blockprint'
import { CategoryTiles, categoryTilesSchema } from './blocks/CategoryTiles'
import { Hero, heroSchema } from './blocks/Hero'
import { ProductStrip, productStripSchema } from './blocks/ProductStrip'
import { ValueProps, valuePropsSchema } from './blocks/ValueProps'

/**
 * The storefront's block registry. Configs arrive from the DB (untrusted) —
 * every block is schema-backed, and blocks whose props fail validation route
 * to blockprint's default fallback (dev: warning box, prod: silently skipped).
 *
 * Adding a block = component + zod schema in `blocks/` + an entry here + an
 * editor card in the admin. Old configs are unaffected (unknown types fall
 * back), so deploy the storefront before saving configs that use a new block.
 * Schemas must evolve additively: new props optional or defaulted, or
 * existing DB configs stop validating.
 */
export const homeRegistry = createRegistry({
  hero: { component: Hero, schema: heroSchema },
  categoryTiles: { component: CategoryTiles, schema: categoryTilesSchema },
  productStrip: { component: ProductStrip, schema: productStripSchema },
  valueProps: { component: ValueProps, schema: valuePropsSchema },
})

export const blockSchemas = {
  hero: heroSchema,
  categoryTiles: categoryTilesSchema,
  productStrip: productStripSchema,
  valueProps: valuePropsSchema,
} as const

export { productStripQuery, productStripSchema } from './blocks/ProductStrip'
