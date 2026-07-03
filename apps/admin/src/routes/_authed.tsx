import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { clearSession, ensureSession } from '../features/auth/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await ensureSession()
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (user.role !== 'ADMIN') {
      // UX-level gate only; every admin API call is role-checked server-side.
      clearSession()
      throw redirect({ to: '/login', search: { denied: true } })
    }
    return { user }
  },
  component: AdminShell,
})

function AdminShell() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <>
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
          <Link to="/" className="font-bold tracking-tight text-brand-900">
            Ethereal Nature · Admin
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-ink/80">
            <Link to="/products" className="hover:text-brand-700 [&.active]:text-brand-700">
              Products
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-ink/50">{user.email}</span>
            <button
              type="button"
              onClick={() => {
                clearSession()
                void navigate({ to: '/login' })
              }}
              className="font-medium text-brand-700 hover:text-brand-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  )
}
