// App chrome: router-level fallbacks (error boundary, 404, slow-load).
import { Art } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'

const primary =
  'inline-flex h-[52px] items-center rounded-full bg-brand px-7 font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep'
const secondary =
  'inline-flex h-[52px] items-center rounded-full border border-line-strong px-7 font-semibold text-heading transition hover:border-brand'

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-4 px-5 pb-24 pt-12 text-center md:pt-20">
      <Art name="plate-sage" className="w-[130px]" eager />
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">Something went wrong</span>
      <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[56px]">
        A branch <em className="font-normal italic text-brand">snapped.</em>
      </h1>
      <p className="max-w-[460px] text-ink-soft">{error.message || 'An unexpected error occurred.'} Try again in a moment.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => window.location.reload()} className={primary}>
          Try again
        </button>
        <Link to="/" className={secondary}>
          Back to the shop
        </Link>
      </div>
    </main>
  )
}

/** 404 — the ginkgo plate (spec §3: ginkgo is the 404 / no-results art). */
export function NotFoundFallback() {
  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-4 px-5 pb-24 pt-10 text-center md:pt-20">
      <Art name="plate-ginkgo" className="rise w-[150px] md:w-[180px]" eager />
      <span className="rise rise-1 font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">404 · Not found</span>
      <h1 className="rise rise-1 font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[72px] md:leading-none">
        This path <em className="font-normal italic text-brand">grew over.</em>
      </h1>
      <p className="rise rise-2 max-w-[440px] text-ink-soft md:text-lg">The page you&apos;re looking for isn&apos;t here any more — or never was.</p>
      <div className="rise rise-3 mt-2 flex flex-wrap justify-center gap-3">
        <Link to="/products" className={primary}>
          Browse the shop
        </Link>
        <Link to="/" className={secondary}>
          Home
        </Link>
      </div>
    </main>
  )
}

export function PendingFallback() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 pt-10 md:px-6 md:pt-16" aria-busy="true">
      <div className="shimmer h-3 w-32 rounded-md bg-skeleton" />
      <div className="shimmer mt-4 h-12 w-2/3 max-w-[520px] rounded-xl bg-skeleton" />
      <div className="shimmer mt-8 h-64 rounded-[28px] bg-skeleton" />
    </main>
  )
}
