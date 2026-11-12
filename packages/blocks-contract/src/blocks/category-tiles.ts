import { defineBlock } from 'blockprint/config'
import { z } from 'zod'
import { CATEGORIES } from '../constants'
import { plain } from '../text'

export const categoryTilesSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic. */
  heading: z.string(),
  tiles: z.array(
    z.object({
      category: z.enum(CATEGORIES),
      label: z.string(),
      blurb: z.string(),
    }),
  ),
})

export type CategoryTilesProps = z.output<typeof categoryTilesSchema>

export const categoryTiles = defineBlock({
  schema: categoryTilesSchema,
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
  summary: (props) => `${plain(props.heading)} · ${props.tiles.length} tiles`,
})
