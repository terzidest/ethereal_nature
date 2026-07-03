// App chrome: router-level fallbacks (error boundary, 404, slow-load).
import { Link } from '@tanstack/react-router'

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-xl font-bold text-brand-900">Something went wrong</h1>
      <p className="text-ink/70">{error.message || 'An unexpected error occurred.'}</p>
      <Link to="/" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← Dashboard
      </Link>
    </main>
  )
}

export function NotFoundFallback() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-xl font-bold text-brand-900">Page not found</h1>
      <Link to="/" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← Dashboard
      </Link>
    </main>
  )
}

export function PendingFallback() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10" aria-busy="true">
      <div className="h-7 w-32 animate-pulse rounded bg-brand-100" />
    </main>
  )
}
