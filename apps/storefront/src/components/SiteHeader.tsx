// App chrome (not a feature slice): the one shared header.
import { Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { useCartSummary } from '../features/cart/useCartSummary'

export function SiteHeader() {
  const { user, isRestoring } = useSession()
  const { itemCount } = useCartSummary()

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
        <div className="ml-auto flex items-center gap-4 text-sm font-medium">
          <Link to="/cart" className="relative text-ink/80 hover:text-brand-700">
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-4 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
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
