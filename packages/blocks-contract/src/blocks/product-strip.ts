import { defineBlock } from 'blockprint/config'
import { z } from 'zod'
import { CATEGORIES, SORTS } from '../constants'
import { plain } from '../text'

export const productStripSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic. */
  title: z.string(),
  category: z.enum(CATEGORIES).optional(),
  sort: z.enum(SORTS).default('newest'),
  limit: z.number().int().min(1).max(12).default(4),
})

export type ProductStripProps = z.output<typeof productStripSchema>

export const productStrip = defineBlock({
  schema: productStripSchema,
  label: 'Product strip',
  defaults: { title: 'New arrivals', sort: 'newest', limit: 4 },
  summary: (props) => `${plain(props.title)} · ${props.category ?? 'all categories'} · ${props.limit} products`,
})
