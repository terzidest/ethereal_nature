// App chrome: router-level fallbacks (error boundary, 404, slow-load).
import { Link } from '@tanstack/react-router'

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold text-brand-900">Something went wrong</h1>
      <p className="text-ink/70">{error.message || 'An unexpected error occurred.'}</p>
      <Link
        to="/"
        className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to the shop
      </Link>
    </main>
  )
}

export function NotFoundFallback() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold text-brand-900">Page not found</h1>
      <p className="text-ink/70">The page you're looking for doesn't exist.</p>
      <Link
        to="/products"
        className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Browse the shop
      </Link>
    </main>
  )
}

export function PendingFallback() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded bg-brand-100" />
    </main>
  )
}
