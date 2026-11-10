import { Art } from '@ethereal-nature/ui'
import { useId, useState } from 'react'
import { z } from 'zod'
import { SectionHeading } from '../emphasis'

export const newsletterSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic. */
  heading: z.string(),
  body: z.string().optional(),
  buttonLabel: z.string().default('Subscribe'),
})

/**
 * "Harvest notes" sign-up — UI only (decision D4): nothing stores or sends
 * addresses yet, so submitting only says so. The address never leaves the page.
 */
export function Newsletter({ eyebrow, heading, body, buttonLabel }: z.output<typeof newsletterSchema>) {
  const [submitted, setSubmitted] = useState(false)
  const noteId = useId()

  return (
    <section className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-6 px-5 py-14 text-center md:py-24">
      <Art name="plate-olive" className="-my-6 w-[110px] rotate-[55deg] md:w-[130px]" />
      <SectionHeading eyebrow={eyebrow} heading={heading} className="items-center" />
      {body && <p className="rise rise-2 max-w-[520px] text-[16px] leading-relaxed text-ink-soft md:text-[18px]">{body}</p>}
      <form
        className="rise rise-3 flex w-full max-w-[520px] flex-col gap-3 sm:flex-row"
        aria-describedby={noteId}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
        }}
      >
        <label className="sr-only" htmlFor={`${noteId}-email`}>
          Email address
        </label>
        <input
          id={`${noteId}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-[54px] flex-1 rounded-full border border-line-strong bg-surface-raised px-6 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-brand"
        />
        <button
          type="submit"
          className="h-[54px] rounded-full bg-brand px-8 text-[15px] font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep"
        >
          {buttonLabel}
        </button>
      </form>
      <p id={noteId} role="status" className="min-h-5 text-sm text-ink-soft">
        {submitted ? 'Sign-ups open with the next harvest — nothing was saved.' : ''}
      </p>
    </section>
  )
}
