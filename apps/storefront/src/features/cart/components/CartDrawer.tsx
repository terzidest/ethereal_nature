import { getCartQueryKey, setCartItemMutation, type CartResponse } from '@ethereal-nature/api-client'
import { ProductArt } from '@ethereal-nature/ui'
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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface-raised shadow-lifted outline-none"
          aria-describedby={undefined}
        >
          <header className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
            <Dialog.Title className="font-display text-xl font-semibold text-brand-900">
              Your cart
            </Dialog.Title>
            <Dialog.Close
              className="rounded-full p-2 text-ink/50 hover:bg-brand-50 hover:text-ink"
              aria-label="Close cart"
            >
              ✕
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {user ? <ServerLines /> : <GuestLines />}
          </div>

          <footer className="flex flex-col gap-3 border-t border-brand-100 px-6 py-4">
            <DrawerTotals />
            <div className="flex gap-3">
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="flex-1 rounded-full bg-brand-50 px-6 py-2.5 text-center text-sm font-semibold text-brand-900 hover:bg-brand-100"
              >
                View cart
              </Link>
              <Link
                to="/checkout"
                onClick={closeDrawer}
                className="flex-1 rounded-full bg-brand-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
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
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-ink/60">Your cart is empty.</p>
      <Link
        to="/products"
        onClick={closeDrawer}
        className="text-sm font-medium text-brand-700 hover:text-brand-900"
      >
        Browse the shop →
      </Link>
    </div>
  )
}

function LineRow({
  productId,
  name,
  category,
  quantity,
  priceLabel,
  onRemove,
}: {
  productId: string
  name: string
  category: string | undefined
  quantity: number
  priceLabel: string
  onRemove: () => void
}) {
  const { closeDrawer } = useCartUi()
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card">
        <ProductArt category={artCategory(category)} seed={productId} className="h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to="/products/$productId"
          params={{ productId }}
          onClick={closeDrawer}
          className="truncate text-sm font-medium text-ink hover:text-brand-700"
        >
          {name}
        </Link>
        <span className="text-xs text-ink/50">× {quantity}</span>
      </div>
      <span className="text-sm font-semibold text-brand-900">{priceLabel}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-xs text-ink/30 hover:text-red-600"
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
    <ul className="divide-y divide-brand-50">
      {lines.map((line) => (
        <LineRow
          key={line.productId}
          productId={line.productId}
          name={line.name}
          category={line.category}
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
    <ul className="divide-y divide-brand-50">
      {lines.map((line) => (
        <LineRow
          key={line.productId}
          productId={line.productId}
          name={line.name}
          category={line.category}
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
      <span className="text-lg font-bold text-brand-900">{formatPrice(total, currency)}</span>
    </div>
  )
}
