// App chrome (not a feature slice): the floating glass header.
import { Link, useRouterState } from '@tanstack/react-router'
import { CATEGORIES } from '../features/catalog/search'
import { useSession } from '../features/account/session'
import { useCartSummary } from '../features/cart/useCartSummary'
import { useCartUi } from '../features/cart/ui-store'
import { BagIcon, SearchIcon } from './icons'
import { BrandMark } from '@ethereal-nature/ui'
import { ThemeSwitch } from './ThemeSwitch'
import { CheckoutSteps } from '../features/checkout/components/CheckoutSteps'
import { flowStepOf } from '../features/checkout/flow'

/** Phone top bar inside the buying flow: a back step and a title instead of the logo. */
/** A product page: /products/<id>. */
const PRODUCT_PAGE = /^\/products\/[^/]+\/?$/

const FLOW_BACK: Array<{ to: '/products' | '/cart'; label: string; title: string }> = [
  { to: '/products', label: 'Continue shopping', title: 'Basket' },
  { to: '/cart', label: 'Back to basket', title: 'Checkout' },
  { to: '/cart', label: 'Back to basket', title: 'Payment' },
]

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  OILS: 'Oils',
  HERBS: 'Herbs',
  CRYSTALS: 'Crystals',
  TEAS: 'Teas',
}

const navLink =
  'rounded-full px-3.5 py-2 text-ink-soft transition hover:text-heading data-[status=active]:bg-brand-soft data-[status=active]:text-heading'

/**
 * Desktop: logo, nav, search, theme, account, cart. Below md only the logo
 * and theme switch stay up here; the rest lives in the bottom tab bar.
 */
export function SiteHeader() {
  const { user, isRestoring } = useSession()
  const { itemCount } = useCartSummary()
  const openDrawer = useCartUi((s) => s.openDrawer)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const step = flowStepOf(pathname)
  const back = step === null ? undefined : FLOW_BACK[step]
  const inFlow = step !== null
  // Phones: a product page has no tab bar (its buy bar takes the bottom), so
  // back and the basket live up here (Mobile Product board).
  const productPage = PRODUCT_PAGE.test(pathname)

  return (
    <header className="sticky top-0 z-30 px-3 pt-2.5 md:px-6 md:pt-[18px]">
      <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-3 rounded-[22px] md:gap-7 border border-line bg-glass pl-3 pr-2 shadow-nav backdrop-blur-[16px] backdrop-saturate-[1.4] md:h-auto md:rounded-full md:py-2.5 md:pl-5 md:pr-2.5">
        {back && (
          <div className="flex min-w-0 items-center gap-1 md:hidden">
            <Link to={back.to} aria-label={back.label} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </Link>
            <span className="font-display text-[19px] font-semibold text-heading">{back.title}</span>
          </div>
        )}
        {productPage && (
          <Link to="/products" aria-label="Back to the shop" className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-heading md:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </Link>
        )}
        <Link
          to="/"
          className={`min-w-0 items-center gap-2.5 ${back ? 'hidden md:flex' : 'flex'}`}
          aria-label="Ethereal Nature home"
        >
          <BrandMark className={`shrink-0 ${productPage ? 'h-[30px] w-[30px] md:h-[34px] md:w-[34px]' : 'h-[34px] w-[34px]'}`} />
          <span className={`whitespace-nowrap font-display font-semibold tracking-tight text-heading md:text-xl ${productPage ? 'text-[17px]' : 'text-[19px]'}`}>
            Ethereal Nature
          </span>
        </Link>

        {step !== null && <CheckoutSteps current={step} />}

        <nav className={`hidden items-center gap-1 text-sm font-medium ${step === null ? 'lg:flex' : ''}`} aria-label="Main">
          {/* explicitUndefined: "no category" must match, or every shelf lights this up too. */}
          <Link
            to="/products"
            search={{ category: undefined }}
            activeOptions={{ explicitUndefined: true }}
            className={navLink}
          >
            Shop all
          </Link>
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to="/products"
              search={{ category }}
              className={navLink}
            >
              {CATEGORY_LABELS[category]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 text-sm font-medium">
          {productPage && (
            <Link
              to="/cart"
              aria-label={`Basket, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              className="relative grid h-11 w-11 place-items-center rounded-full bg-brand text-on-brand shadow-glow md:hidden"
            >
              <BagIcon className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-accent px-1 text-[11px] font-bold text-on-amber">
                {itemCount}
              </span>
            </Link>
          )}
          {!inFlow && (
            <Link
              to="/products"
              aria-label="Search products"
              className="hidden h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:text-heading md:grid"
            >
              <SearchIcon className="h-[18px] w-[18px]" />
            </Link>
          )}
          <ThemeSwitch />
          {/* In the buying flow the right side calms down (Cart / Checkout boards). */}
          {inFlow && (
            <div className="hidden md:block">
              {step! >= 1 && user ? (
                <span className="flex items-center gap-2.5 pl-1.5 pr-3 text-[13px] text-ink-soft">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-wash text-xs font-semibold uppercase text-heading" aria-hidden="true">
                    {user.email.charAt(0)}
                  </span>
                  <span className="max-w-[200px] truncate">{user.email}</span>
                </span>
              ) : (
                <Link to="/products" className="px-3.5 py-2.5 text-ink-soft transition hover:text-heading">
                  Continue shopping
                </Link>
              )}
            </div>
          )}
          <div className={inFlow ? 'hidden' : 'hidden md:block'}>
            {isRestoring ? (
              <span className="inline-block w-[72px]" />
            ) : user ? (
              <Link to="/account" className="px-3.5 py-2.5 text-ink-soft transition hover:text-heading">
                Account
              </Link>
            ) : (
              <Link to="/login" className="px-3.5 py-2.5 text-ink-soft transition hover:text-heading">
                Sign in
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={openDrawer}
            className={`hidden h-11 items-center gap-2 rounded-full bg-brand pl-[18px] pr-2 font-semibold text-on-brand transition hover:bg-brand-deep ${inFlow ? '' : 'md:flex'}`}
            aria-label={`Open cart, ${itemCount} items`}
          >
            Cart
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-on-brand/20 px-1.5 text-xs">
              {itemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
