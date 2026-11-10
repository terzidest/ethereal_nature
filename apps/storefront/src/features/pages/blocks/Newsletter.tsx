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
    <section className="relative mx-auto flex w-full max-w-[880px] flex-col items-center gap-5 px-5 pb-14 pt-6 text-center md:pb-[120px] md:pt-10">
      <span className="aurora -top-10 left-1/2 h-[300px] w-[480px] -translate-x-1/2 bg-[light-dark(rgb(122_196_148/0.40),rgb(60_160_105/0.30))] max-md:w-[320px]" aria-hidden="true" />
      {/* Olive sprig between two hairlines (Home board divider). */}
      <div className="relative flex w-full max-w-[420px] items-center gap-[18px]" aria-hidden="true">
        <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--color-line-strong))]" />
        <Art name="plate-olive" className="w-[72px] -rotate-[38deg] md:w-[84px]" />
        <span className="h-px flex-1 bg-[linear-gradient(270deg,transparent,var(--color-line-strong))]" />
      </div>
      <SectionHeading eyebrow={eyebrow} heading={heading} className="items-center" />
      {body && <p className="rise rise-2 max-w-[520px] text-[16px] leading-relaxed text-ink-soft md:text-[18px]">{body}</p>}
      {/* Desktop: one pill with the button inside. Phones: field and button stacked, full width. */}
      <form
        className="rise rise-3 relative mt-2 flex w-full max-w-[520px] flex-col gap-3 md:flex-row md:gap-2 md:rounded-full md:border md:border-line-strong md:bg-surface-raised md:p-1.5 md:shadow-card"
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
          className="h-[52px] min-w-0 flex-1 rounded-full border border-line-strong bg-surface-raised px-5 text-base text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-brand md:h-12 md:border-0 md:bg-transparent md:text-[15px]"
        />
        <button
          type="submit"
          className="h-[52px] rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep md:h-12"
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
