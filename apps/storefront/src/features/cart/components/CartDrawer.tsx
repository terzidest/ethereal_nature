import { getCartQueryKey, setCartItemMutation, type CartResponse } from '@ethereal-nature/api-client'
import { ProductImage, Art } from '@ethereal-nature/ui'
import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useSession } from '../../account/session'
import { formatPrice } from '../../catalog/derive'
import { artCategory } from '../art'
import { useGuestCart } from '../guest-store'
import { useCartSummary } from '../useCartSummary'
import { useCartUi } from '../ui-store'

export function CartDrawer() {
  const { isDrawerOpen, closeDrawer } = useCartUi()
  const { user } = useSession()

  return (
    <Dialog.Root open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface-raised shadow-lifted outline-none"
          aria-describedby={undefined}
        >
          <header className="flex items-center justify-between border-b border-line px-6 py-4">
            <Dialog.Title className="font-display text-xl font-semibold text-heading">
              Your cart
            </Dialog.Title>
            <Dialog.Close
              className="rounded-full p-2 text-ink/50 hover:bg-brand-soft hover:text-ink"
              aria-label="Close cart"
            >
              ✕
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {user ? <ServerLines /> : <GuestLines />}
          </div>

          <footer className="flex flex-col gap-3 border-t border-line px-6 py-4">
            <DrawerTotals />
            <div className="flex gap-3">
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="flex-1 rounded-full bg-brand-soft px-6 py-2.5 text-center text-sm font-semibold text-heading hover:bg-brand-soft-strong"
              >
                View cart
              </Link>
              <Link
                to="/checkout"
                onClick={closeDrawer}
                className="flex-1 rounded-full bg-brand px-6 py-2.5 text-center text-sm font-semibold text-on-brand hover:bg-brand-deep"
              >
                Checkout
              </Link>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function EmptyDrawer() {
  const { closeDrawer } = useCartUi()
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Art name="plate-sage" className="w-24" />
      <p className="mt-2 font-display text-xl font-semibold text-heading">Your basket is resting</p>
      <p className="text-sm text-ink-soft">The herbs are a good place to start.</p>
      <Link
        to="/products"
        search={{ category: 'HERBS' }}
        onClick={closeDrawer}
        className="mt-2 text-sm font-medium text-brand hover:text-heading"
      >
        Browse herbs →
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
  priceLabel,
  onRemove,
}: {
  productId: string
  name: string
  category: string | undefined
  imageUrl: string | null | undefined
  quantity: number
  priceLabel: string
  onRemove: () => void
}) {
  const { closeDrawer } = useCartUi()
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card">
        <ProductImage imageUrl={imageUrl} name={name} category={artCategory(category)} seed={productId} className="h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to="/products/$productId"
          params={{ productId }}
          onClick={closeDrawer}
          className="truncate text-sm font-medium text-ink hover:text-brand"
        >
          {name}
        </Link>
        <span className="text-xs text-ink/50">× {quantity}</span>
      </div>
      <span className="text-sm font-semibold text-heading">{priceLabel}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-xs text-ink/30 hover:text-danger"
        aria-label={`Remove ${name}`}
      >
        ✕
      </button>
    </li>
  )
}

function ServerLines() {
  const queryClient = useQueryClient()
  const { serverCart } = useCartSummary()
  const mutation = useMutation({
    ...setCartItemMutation({ throwOnError: true }),
    onSuccess: (cart: CartResponse) => queryClient.setQueryData(getCartQueryKey(), cart),
  })

  if (serverCart.isPending) return <p className="py-8 text-sm text-ink/50">Loading…</p>
  const lines = serverCart.data?.lines ?? []
  if (lines.length === 0) return <EmptyDrawer />

  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => (
        <LineRow
          key={line.productId}
          productId={line.productId}
          name={line.name}
          category={line.category}
          imageUrl={line.imageUrl}
          quantity={line.quantity}
          priceLabel={formatPrice(line.lineTotalMinor, line.currency)}
          onRemove={() => mutation.mutate({ body: { productId: line.productId, quantity: 0 } })}
        />
      ))}
    </ul>
  )
}

function GuestLines() {
  const { lines, setQuantity } = useGuestCart()
  if (lines.length === 0) return <EmptyDrawer />

  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => (
        <LineRow
          key={line.productId}
          productId={line.productId}
          name={line.name}
          category={line.category}
          imageUrl={line.imageUrl}
          quantity={line.quantity}
          priceLabel={formatPrice(line.priceSnapshotMinor * line.quantity, line.currency)}
          onRemove={() => setQuantity(line.productId, 0)}
        />
      ))}
    </ul>
  )
}

function DrawerTotals() {
  const { user } = useSession()
  const { serverCart, guestLines } = useCartSummary()

  const total = user
    ? (serverCart.data?.subtotalMinor ?? 0)
    : guestLines.reduce((sum, l) => sum + l.priceSnapshotMinor * l.quantity, 0)
  const currency = user
    ? (serverCart.data?.currency ?? 'EUR')
    : (guestLines[0]?.currency ?? 'EUR')

  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-ink/60">{user ? 'Subtotal' : 'Estimated total'}</span>
      <span className="text-lg font-bold text-heading">{formatPrice(total, currency)}</span>
    </div>
  )
}
