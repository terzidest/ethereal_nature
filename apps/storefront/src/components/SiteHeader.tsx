// App chrome (not a feature slice): the one shared header.
import { Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { useCartSummary } from '../features/cart/useCartSummary'
import { useCartUi } from '../features/cart/ui-store'
import { LeafMark } from './LeafMark'
import { ThemeSwitch } from './ThemeSwitch'

export function SiteHeader() {
  const { user, isRestoring } = useSession()
  const { itemCount } = useCartSummary()
  const openDrawer = useCartUi((s) => s.openDrawer)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <LeafMark className="h-7 w-7" />
          <span className="font-display text-xl font-semibold tracking-tight text-heading">
            Ethereal Nature
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/70 md:flex" aria-label="Main">
          <Link to="/products" className="hover:text-brand [&.active]:text-brand">
            Shop
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-5 text-sm font-medium">
          <ThemeSwitch />
          {isRestoring ? (
            <span className="w-14" />
          ) : user ? (
            <Link to="/account" className="text-ink/70 hover:text-brand">
              Account
            </Link>
          ) : (
            <Link to="/login" className="text-ink/70 hover:text-brand">
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={openDrawer}
            className="relative rounded-full bg-brand-soft px-4 py-2 text-heading transition hover:bg-brand-soft-strong"
            aria-label={`Open cart, ${itemCount} items`}
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-on-brand">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
