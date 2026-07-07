// App chrome (not a feature slice): the one shared header.
import { Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { useCartSummary } from '../features/cart/useCartSummary'
import { useCartUi } from '../features/cart/ui-store'
import { LeafMark } from './LeafMark'

export function SiteHeader() {
  const { user, isRestoring } = useSession()
  const { itemCount } = useCartSummary()
  const openDrawer = useCartUi((s) => s.openDrawer)

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <LeafMark className="h-7 w-7" />
          <span className="font-display text-xl font-semibold tracking-tight text-brand-900">
            Ethereal Nature
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/70 md:flex" aria-label="Main">
          <Link to="/products" className="hover:text-brand-700 [&.active]:text-brand-700">
            Shop
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-5 text-sm font-medium">
          {isRestoring ? (
            <span className="w-14" />
          ) : user ? (
            <Link to="/account" className="text-ink/70 hover:text-brand-700">
              Account
            </Link>
          ) : (
            <Link to="/login" className="text-ink/70 hover:text-brand-700">
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={openDrawer}
            className="relative rounded-full bg-brand-50 px-4 py-2 text-brand-900 transition hover:bg-brand-100"
            aria-label={`Open cart, ${itemCount} items`}
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
