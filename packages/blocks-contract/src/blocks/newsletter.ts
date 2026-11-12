import { defineBlock } from 'blockprint/config'
import { z } from 'zod'
import { plain } from '../text'

export const newsletterSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic. */
  heading: z.string(),
  body: z.string().optional(),
  buttonLabel: z.string().default('Subscribe'),
})

export type NewsletterProps = z.output<typeof newsletterSchema>

export const newsletter = defineBlock({
  schema: newsletterSchema,
  label: 'Newsletter',
  defaults: {
    eyebrow: 'Harvest notes',
    heading: 'Hear when the next batch *is ready.*',
    body: 'One short letter per harvest. No noise.',
    buttonLabel: 'Subscribe',
  },
  summary: (props) => plain(props.heading),
})
