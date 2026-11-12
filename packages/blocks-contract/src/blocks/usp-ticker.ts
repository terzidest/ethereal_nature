import { defineBlock } from 'blockprint/config'
import { z } from 'zod'

export const uspTickerSchema = z.object({
  items: z.array(z.string()).min(1),
})

export type UspTickerProps = z.output<typeof uspTickerSchema>

export const uspTicker = defineBlock({
  schema: uspTickerSchema,
  label: 'Values ticker',
  defaults: {
    items: [
      'Steam-distilled oils',
      'Whole dried herbs',
      'Hand-picked crystals',
      'Loose-leaf teas',
      'Plastic-free post',
      'Small batches',
    ],
  },
  summary: (props) => props.items.join(' · '),
})
