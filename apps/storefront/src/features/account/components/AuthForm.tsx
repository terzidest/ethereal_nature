import type { ReactNode } from 'react'

export function AuthForm({
  title,
  submitLabel,
  isPending,
  error,
  onSubmit,
  footer,
}: {
  title: string
  submitLabel: string
  isPending: boolean
  error: string | null
  onSubmit: (email: string, password: string) => void
  footer: ReactNode
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">{title}</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          onSubmit(form.get('email')?.toString() ?? '', form.get('password')?.toString() ?? '')
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-brand-100 bg-white px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded border border-brand-100 bg-white px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? 'Please wait…' : submitLabel}
        </button>
      </form>
      <div className="text-sm text-ink/70">{footer}</div>
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
