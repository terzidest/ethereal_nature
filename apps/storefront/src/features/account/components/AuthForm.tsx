import { Art, type ArtName } from '@ethereal-nature/ui'
import { useId, type ReactNode } from 'react'

const input =
  'h-[52px] rounded-full border border-line-strong bg-surface-raised px-5 text-base font-normal text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand'

/**
 * Sign in / Create account (not on the boards: the existing layout restyled
 * with the redesign tokens — eyebrow, display headline with an italic
 * emphasis, pill fields, a botanical plate beside the card on desktop).
 */
export function AuthForm({
  eyebrow,
  title,
  emphasis,
  intro,
  art,
  mode,
  submitLabel,
  isPending,
  error,
  onSubmit,
  footer,
}: {
  eyebrow: string
  title: string
  emphasis: string
  intro: string
  art: ArtName
  mode: 'sign-in' | 'register'
  submitLabel: string
  isPending: boolean
  error: string | null
  onSubmit: (email: string, password: string) => void
  footer: ReactNode
}) {
  const id = useId()
  return (
    <main className="relative mx-auto grid w-full max-w-[1040px] grid-cols-[minmax(0,1fr)] items-center gap-10 overflow-x-clip px-5 pb-16 pt-8 md:grid-cols-[1fr_420px] md:gap-16 md:px-6 md:pb-[120px] md:pt-20">
      <span
        className="aurora -left-40 top-0 h-[320px] w-[320px] bg-[light-dark(rgb(122_196_148/0.40),rgb(60_160_105/0.30))] md:h-[480px] md:w-[480px]"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4">
        <span className="rise font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">{eyebrow}</span>
        <h1 className="rise rise-1 font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[68px] md:leading-none">
          {title} <em className="font-normal italic text-brand">{emphasis}</em>
        </h1>
        <p className="rise rise-2 max-w-[420px] text-base leading-relaxed text-ink-soft md:text-lg">{intro}</p>
        <Art name={art} className="mt-4 hidden w-[180px] md:block" />
      </div>

      <div className="relative flex flex-col gap-5">
        <form
          className="rise rise-2 flex flex-col gap-4 rounded-[28px] border border-line bg-surface-raised p-6 shadow-card md:p-8"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            onSubmit(form.get('email')?.toString() ?? '', form.get('password')?.toString() ?? '')
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
            Email
            <input name="email" type="email" required autoComplete="email" className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              aria-describedby={mode === 'register' ? `${id}-hint` : undefined}
              className={input}
            />
            {mode === 'register' && (
              <span id={`${id}-hint`} className="text-xs font-normal text-ink-soft">
                At least 8 characters.
              </span>
            )}
          </label>
          {error && (
            <p role="alert" className="shake rounded-2xl border border-amber-line bg-amber-wash px-4 py-3 text-sm text-amber-text">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="mt-1 flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-brand text-[15px] font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep disabled:opacity-70"
          >
            {isPending && <span className="spinner" aria-hidden="true" />}
            {isPending ? 'One moment…' : submitLabel}
          </button>
        </form>
        <div className="text-center text-sm text-ink-soft">{footer}</div>
      </div>
    </main>
  )
}

/** Pull the human-readable message out of a backend ErrorResponse. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Something went wrong — please try again.'
}
