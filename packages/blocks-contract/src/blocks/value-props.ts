import { defineBlock } from 'blockprint/config'
import { z } from 'zod'

export const valuePropsSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic, in warm amber on the deep panel. */
  heading: z.string().optional(),
  /** Caption under the bouquet art. */
  caption: z.string().optional(),
  items: z.array(z.object({ title: z.string(), blurb: z.string() })),
})

export type ValuePropsProps = z.output<typeof valuePropsSchema>

export const valueProps = defineBlock({
  schema: valuePropsSchema,
  label: 'Value props',
  defaults: {
    items: [
      { title: 'Sourced with care', blurb: 'Every grower and cutter is someone we know by name.' },
      { title: 'Small batches', blurb: 'Short runs, fresh stock — nothing sits in a warehouse for years.' },
      { title: 'Plastic-free post', blurb: 'Recycled boxes, paper tape, no fillers.' },
    ],
  },
  summary: (props) => props.items.map((item) => item.title).join(' · '),
})
