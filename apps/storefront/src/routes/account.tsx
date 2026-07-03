import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSession } from '../features/account/session'

export const Route = createFileRoute('/account')({
  head: () => ({ meta: [{ title: 'Account | Ethereal Nature' }] }),
  component: AccountPage,
})

function AccountPage() {
  const { user, isRestoring, logout } = useSession()
  const navigate = useNavigate()

  if (isRestoring) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-ink/50">Loading your account…</main>
  }

  if (!user) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
        <h1 className="text-2xl font-bold text-brand-900">You're not signed in</h1>
        <p className="text-ink/70">Sign in to see your account and order history.</p>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-brand-50 px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-100"
          >
            Create account
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">Account</h1>
      <dl className="flex flex-col gap-2 text-ink">
        <div className="flex gap-2">
          <dt className="font-medium">Email:</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Role:</dt>
          <dd>{user.role}</dd>
        </div>
      </dl>
      <p className="text-sm text-ink/50">Order history arrives with checkout (Phase 4).</p>
      <button
        type="button"
        onClick={() => {
          logout()
          void navigate({ to: '/' })
        }}
        className="rounded-full bg-brand-50 px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-100"
      >
        Sign out
      </button>
    </main>
  )
}
