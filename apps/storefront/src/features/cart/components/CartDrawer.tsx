import { getCartQueryKey, setCartItemMutation, type CartResponse } from '@ethereal-nature/api-client'
import { Art, ProductImage } from '@ethereal-nature/ui'
import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useSession } from '../../account/session'
import { formatPrice } from '../../catalog/derive'
import { artCategory } from '../art'
import { useGuestCart } from '../guest-store'
import { useCartSummary } from '../useCartSummary'
import { useCartUi } from '../ui-store'

/**
 * The basket, opened from the header or by any "add" (Catalog / Mobile
 * Catalog boards): a floating drawer from the right on desktop, a sheet from
 * the bottom on phones. Totals are display-only — the server recomputes price
 * and stock at checkout.
 */
export function CartDrawer() {
  const { isDrawerOpen, closeDrawer } = useCartUi()
  const { user } = useSession()
  const { itemCount } = useCartSummary()
  const countLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`

  return (
    <Dialog.Root open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim-in fixed inset-0 z-40 bg-scrim backdrop-blur-[4px] md:bg-[rgb(8_18_12/0.38)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[82vh] flex-col overflow-hidden rounded-t-[28px] bg-surface-raised shadow-lifted outline-none md:slide-in md:inset-x-auto md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-[440px] md:max-w-[calc(100%-24px)] md:rounded-[28px] md:border md:border-line"
        >
          <header className="px-5 pt-2.5 md:flex md:items-center md:justify-between md:border-b md:border-line md:px-6 md:pb-5 md:pt-6">
            <div className="mx-auto mb-3.5 h-1 w-10 rounded bg-line-strong md:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between md:contents">
              <Dialog.Title className="flex flex-col md:gap-1">
                <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:block">Your basket</span>
                <span className="font-display text-[22px] font-semibold text-heading md:text-[28px]">
                  <span className="md:hidden">Your basket </span>
                  <span className="font-sans text-[13px] font-medium text-ink-soft md:hidden">· {countLabel}</span>
                  <span className="hidden md:inline">{countLabel}</span>
                </span>
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close basket"
                className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:text-heading md:border md:border-line-strong md:text-heading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Dialog.Close>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-1 md:px-6 md:py-2">{user ? <ServerLines /> : <GuestLines />}</div>

          {itemCount > 0 && <DrawerFooter />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerFooter() {
  const { closeDrawer } = useCartUi()
  const { isAuthenticated, serverCart, guestLines } = useCartSummary()
  const total = isAuthenticated
    ? (serverCart.data?.subtotalMinor ?? 0)
    : guestLines.reduce((sum, l) => sum + l.priceSnapshotMinor * l.quantity, 0)
  const currency = isAuthenticated ? (serverCart.data?.currency ?? 'EUR') : (guestLines[0]?.currency ?? 'EUR')
  const subtotal = formatPrice(total, currency)

  return (
    <footer className="flex flex-col gap-2.5 border-t border-line px-5 pb-7 pt-3.5 md:gap-3.5 md:bg-sand-100 md:px-6 md:pb-6 md:pt-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-soft md:text-base">Subtotal</span>
        {/* Rolling total: the key remounts the figure, so it rolls in on every change. */}
        <span className="block h-8 overflow-hidden" aria-live="polite">
          <span key={subtotal} className="roll block font-display text-[22px] font-semibold leading-8 text-heading md:text-[26px]">
            {subtotal}
          </span>
        </span>
      </div>
      <span className="text-xs text-ink-soft">Prices and stock are confirmed at checkout.</span>
      <Link
        to="/checkout"
        onClick={closeDrawer}
        className="flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-brand text-[15px] font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep active:scale-[0.97] md:h-14"
      >
        Checkout
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
      <Link to="/cart" onClick={closeDrawer} className="text-center text-sm font-medium text-brand hover:text-heading">
        View basket
      </Link>
    </footer>
  )
}

function EmptyDrawer() {
  const { closeDrawer } = useCartUi()
  return (
    <div className="flex flex-col items-center gap-2 pb-6 pt-4 text-center md:gap-2.5 md:py-8">
      <Art name="plate-sage" className="w-[110px] md:w-[130px]" />
      <p className="font-display text-xl font-semibold text-heading md:text-[22px]">Your basket is resting</p>
      <p className="text-sm text-ink-soft">The herbs are a good place to start.</p>
      <Link
        to="/products"
        search={{ category: 'HERBS' }}
        onClick={closeDrawer}
        className="mt-2 inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-sm font-semibold text-heading transition hover:border-brand"
      >
        Browse herbs
      </Link>
    </div>
  )
}

function LineRow({
  productId,
  name,
  category,
  imageUrl,
  quantity,
  max,
  lineLabel,
  pending,
  onQuantity,
}: {
  productId: string
  name: string
  category: string | undefined
  imageUrl: string | null | undefined
  quantity: number
  /** Stock cap when known (server cart); guests are clamped by the server at merge/checkout. */
  max?: number
  lineLabel: string
  pending?: boolean
  onQuantity: (quantity: number) => void
}) {
  const { closeDrawer } = useCartUi()
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 md:grid md:grid-cols-[84px_minmax(0,1fr)_auto] md:gap-4 md:py-4">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] md:h-[104px] md:w-[84px] md:rounded-2xl">
        <ProductImage imageUrl={imageUrl} name={name} category={artCategory(category)} seed={productId} className="h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2.5">
        <Link
          to="/products/$productId"
          params={{ productId }}
          onClick={closeDrawer}
          className="text-sm font-medium leading-[1.3] text-heading hover:text-brand md:text-base"
        >
          {name}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <Stepper name={name} quantity={quantity} max={max} pending={pending} onQuantity={onQuantity} />
          <span className="font-display text-base font-semibold text-heading md:hidden">{lineLabel}</span>
        </div>
      </div>
      <span className="hidden font-display text-lg font-semibold text-heading md:block">{lineLabel}</span>
    </li>
  )
}

function Stepper({
  name,
  quantity,
  max,
  pending,
  onQuantity,
}: {
  name: string
  quantity: number
  max?: number
  pending?: boolean
  onQuantity: (quantity: number) => void
}) {
  const button =
    'grid h-9 w-9 place-items-center rounded-full text-lg text-heading transition hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent'
  return (
    <div className="inline-flex items-center gap-0.5 self-start rounded-full border border-line-strong p-0.5 md:p-0">
      <button type="button" onClick={() => onQuantity(quantity - 1)} disabled={pending} aria-label={`One fewer ${name}`} className={button}>
        −
      </button>
      <span className="min-w-6 text-center font-mono text-[13px]" aria-label={`Quantity ${quantity}`}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onQuantity(quantity + 1)}
        disabled={pending || (max !== undefined && quantity >= max)}
        aria-label={`One more ${name}`}
        className={button}
      >
        +
      </button>
    </div>
  )
}

function ServerLines() {
  const queryClient = useQueryClient()
  const { serverCart } = useCartSummary()
  const mutation = useMutation({
    ...setCartItemMutation({ throwOnError: true }),
    onSuccess: (cart: CartResponse) => queryClient.setQueryData(getCartQueryKey(), cart),
  })

  if (serverCart.isPending) return <p className="py-8 text-sm text-ink-soft">Loading…</p>
  const lines = serverCart.data?.lines ?? []
  if (lines.length === 0) return <EmptyDrawer />

  return (
    <ul>
      {lines.map((line) => (
        <LineRow
          key={line.productId}
          productId={line.productId}
          name={line.name}
          category={line.category}
          imageUrl={line.imageUrl}
          quantity={line.quantity}
          max={line.stock}
          pending={mutation.isPending}
          lineLabel={formatPrice(line.lineTotalMinor, line.currency)}
          onQuantity={(quantity) => mutation.mutate({ body: { productId: line.productId, quantity } })}
        />
      ))}
    </ul>
  )
}

function GuestLines() {
  const { lines, setQuantity } = useGuestCart()
  if (lines.length === 0) return <EmptyDrawer />

  return (
    <ul>
      {lines.map((line) => (
        <LineRow
          key={line.productId}
          productId={line.productId}
          name={line.name}
          category={line.category}
          imageUrl={line.imageUrl}
          quantity={line.quantity}
          lineLabel={formatPrice(line.priceSnapshotMinor * line.quantity, line.currency)}
          onQuantity={(quantity) => setQuantity(line.productId, quantity)}
        />
      ))}
    </ul>
  )
}
