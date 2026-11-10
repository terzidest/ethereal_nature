// App chrome: router-level fallbacks (error boundary, 404, slow-load).
import { Link } from '@tanstack/react-router'

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold text-heading">Something went wrong</h1>
      <p className="text-ink/70">{error.message || 'An unexpected error occurred.'}</p>
      <Link
        to="/"
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-deep"
      >
        Back to the shop
      </Link>
    </main>
  )
}

export function NotFoundFallback() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold text-heading">Page not found</h1>
      <p className="text-ink/70">The page you're looking for doesn't exist.</p>
      <Link
        to="/products"
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-deep"
      >
        Browse the shop
      </Link>
    </main>
  )
}

export function PendingFallback() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded bg-skeleton" />
    </main>
  )
}
