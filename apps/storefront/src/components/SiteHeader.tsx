// App chrome (not a feature slice): the one shared header.
import { Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'

export function SiteHeader() {
  const { user, isRestoring } = useSession()

  return (
    <header className="border-b border-brand-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <Link to="/" className="text-lg font-bold tracking-tight text-brand-900">
          Ethereal Nature
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-ink/80">
          <Link to="/products" className="hover:text-brand-700">
            Shop
          </Link>
        </nav>
        <div className="ml-auto text-sm font-medium">
          {isRestoring ? null : user ? (
            <Link to="/account" className="text-brand-700 hover:text-brand-900">
              {user.email}
            </Link>
          ) : (
            <Link to="/login" className="text-brand-700 hover:text-brand-900">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
