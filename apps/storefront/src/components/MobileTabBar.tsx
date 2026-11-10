// App chrome: the phone-width bottom tab bar (hidden from md up).
import { Link, useRouterState } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { useCartSummary } from '../features/cart/useCartSummary'
import { BagIcon, HomeIcon, SearchIcon, ShopIcon, UserIcon } from './icons'

/** Routes that bring their own sticky action bar, so no tab bar there. */
const FOCUSED_PREFIXES = ['/checkout', '/pay/']

const tabBase = 'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-soft'
const tab = `${tabBase} data-[status=active]:font-semibold data-[status=active]:text-heading`

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { user } = useSession()
  const { itemCount } = useCartSummary()

  if (FOCUSED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-glass pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-[16px] backdrop-saturate-[1.4] md:hidden"
    >
      <div className="flex items-stretch">
        <Link to="/" activeOptions={{ exact: true }} className={tab}>
          <HomeIcon className="h-[22px] w-[22px]" />
          Home
        </Link>
        <Link to="/products" activeOptions={{ includeSearch: false }} className={tab}>
          <ShopIcon className="h-[22px] w-[22px]" />
          Shop
        </Link>
        <Link to="/cart" className={`${tab} justify-end pb-2`} aria-label={`Basket, ${itemCount} items`}>
          <span className="relative -mt-7 grid h-[58px] w-[58px] place-items-center rounded-full border-4 border-surface bg-brand text-on-brand shadow-glow">
            <BagIcon className="h-[22px] w-[22px]" />
            <span className="absolute -right-1 -top-0.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-amber-accent px-1.5 text-[11px] font-bold text-on-amber">
              {itemCount}
            </span>
          </span>
          Basket
        </Link>
        {/* Shortcut into the catalog search; Shop already shows the active state. */}
        <Link to="/products" className={tabBase} aria-label="Search products">
          <SearchIcon className="h-[22px] w-[22px]" />
          Search
        </Link>
        <Link to={user ? '/account' : '/login'} className={tab}>
          <UserIcon className="h-[22px] w-[22px]" />
          Account
        </Link>
      </div>
    </nav>
  )
}
