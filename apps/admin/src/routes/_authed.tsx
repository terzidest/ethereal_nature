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

  const signOut = () => {
    clearSession()
    void navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen bg-brand-50/40">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-brand-900 md:flex">
        <Link to="/" className="flex items-baseline gap-2 px-6 py-5">
          <span className="font-bold tracking-tight text-white">Ethereal Nature</span>
          <span className="rounded bg-brand-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-200">
            Admin
          </span>
        </Link>
        <nav className="flex flex-col gap-1 px-3 py-2 text-sm font-medium" aria-label="Admin">
          <NavItem to="/" label="Dashboard" exact />
          <NavItem to="/products" label="Products" />
          <NavItem to="/orders" label="Orders" />
        </nav>
        <div className="mt-auto border-t border-brand-800 px-6 py-4 text-sm">
          <p className="truncate text-brand-200/80" title={user.email}>
            {user.email}
          </p>
          <button type="button" onClick={signOut} className="mt-1 font-medium text-brand-200 hover:text-white">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Small screens get a plain top bar instead of a drawer — this is a desktop tool. */}
        <header className="flex items-center gap-4 border-b border-brand-100 bg-white px-4 py-3 text-sm md:hidden">
          <Link to="/" className="font-bold tracking-tight text-brand-900">
            EN · Admin
          </Link>
          <nav className="flex gap-3 font-medium text-ink/80" aria-label="Admin">
            <Link to="/products" className="hover:text-brand-700 [&.active]:text-brand-700">
              Products
            </Link>
            <Link to="/orders" className="hover:text-brand-700 [&.active]:text-brand-700">
              Orders
            </Link>
          </nav>
          <button type="button" onClick={signOut} className="ml-auto font-medium text-brand-700 hover:text-brand-900">
            Sign out
          </button>
        </header>

        <Outlet />
      </div>
    </div>
  )
}

function NavItem({ to, label, exact }: { to: '/' | '/products' | '/orders'; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      className="rounded-md px-3 py-2 text-brand-100/80 transition hover:bg-brand-800 hover:text-white [&.active]:bg-brand-800 [&.active]:text-white"
    >
      {label}
    </Link>
  )
}
