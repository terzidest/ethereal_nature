import { defineBlock } from 'blockprint/config'
import { z } from 'zod'
import { SORTS } from '../constants'
import { plain } from '../text'

export const heroSchema = z.object({
  eyebrow: z.string(),
  /** `*words*` render italic (see the storefront's emphasis.tsx). */
  title: z.string(),
  subtitle: z.string(),
  primaryCta: z.object({ label: z.string() }),
  secondaryCta: z.object({
    label: z.string(),
    sort: z.enum(SORTS).optional(),
    /** Price ceiling in minor units for the catalog link ("Under €15" → 1500). */
    maxPriceMinor: z.number().int().positive().optional(),
  }),
  /** Short reassurance row under the buttons. */
  trust: z.array(z.string()).max(4).default([]),
})

export type HeroProps = z.output<typeof heroSchema>

export const hero = defineBlock({
  schema: heroSchema,
  label: 'Hero',
  defaults: {
    eyebrow: 'New season harvest',
    title: 'A headline for the shop.',
    subtitle: 'A sentence that sets the mood.',
    primaryCta: { label: 'Shop everything' },
    secondaryCta: { label: 'Under €15', maxPriceMinor: 1500 },
    trust: ['Sourced with care', 'Plastic-free post', 'Secure checkout'],
  },
  summary: (props) => plain(props.title),
})
