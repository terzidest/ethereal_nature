import { manifest } from '@ethereal-nature/blocks-contract'
import { createRegistry } from 'blockprint'
import { CategoryTiles } from './blocks/CategoryTiles'
import { Hero } from './blocks/Hero'
import { Newsletter } from './blocks/Newsletter'
import { ProductStrip } from './blocks/ProductStrip'
import { UspTicker } from './blocks/UspTicker'
import { ValueProps } from './blocks/ValueProps'

/**
 * The storefront's block registry: the shared manifest (schemas, labels,
 * defaults — see @ethereal-nature/blocks-contract) joined with this app's
 * components. Configs arrive from the DB (untrusted) — every block is
 * schema-backed, and blocks whose props fail validation route to blockprint's
 * default fallback (dev: warning box, prod: silently skipped).
 *
 * Adding a block = schema + defineBlock entry in the contract package +
 * a component here + an editor card in the admin (see the add-block skill).
 * Old configs are unaffected (unknown types fall back), so deploy the
 * storefront before saving configs that use a new block.
 */
export const homeRegistry = createRegistry(manifest, {
  hero: Hero,
  uspTicker: UspTicker,
  categoryTiles: CategoryTiles,
  productStrip: ProductStrip,
  valueProps: ValueProps,
  newsletter: Newsletter,
})

export { productStripQuery } from './blocks/ProductStrip'
