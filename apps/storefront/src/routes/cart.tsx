import {
  getCartQueryKey,
  setCartItemMutation,
  type CartLineResponse,
  type CartResponse,
} from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductArt } from '@ethereal-nature/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { formatPrice } from '../features/catalog/derive'
import { artCategory } from '../features/cart/art'
import { AdjustmentsBanner } from '../features/cart/components/AdjustmentsBanner'
import { useGuestCart } from '../features/cart/guest-store'
import { useCartSummary } from '../features/cart/useCartSummary'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Cart | Ethereal Nature' }] }),
  component: CartPage,
})

function CartPage() {
  const { user } = useSession()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900">Your cart</h1>
      <AdjustmentsBanner />
      {user ? <ServerCart /> : <GuestCart />}
    </main>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="text-ink/60">Your cart is empty.</p>
      <Link
        to="/products"
        className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Browse the shop
      </Link>
    </div>
  )
}

function QuantityControls({
  quantity,
  onChange,
  max,
  disabled,
}: {
  quantity: number
  onChange: (next: number) => void
  max?: number
  disabled?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease quantity"
        className="h-7 w-7 rounded-full bg-brand-50 font-semibold text-brand-900 hover:bg-brand-100 disabled:opacity-40"
      >
        −
      </button>
      <span className="w-6 text-center text-sm">{quantity}</span>
      <button
        type="button"
        disabled={disabled || (max !== undefined && quantity >= max)}
        onClick={() => onChange(quantity + 1)}
        aria-label="Increase quantity"
        className="h-7 w-7 rounded-full bg-brand-50 font-semibold text-brand-900 hover:bg-brand-100 disabled:opacity-40"
      >
        +
      </button>
    </span>
  )
}

function ServerCart() {
  const queryClient = useQueryClient()
  const { serverCart } = useCartSummary()
  const mutation = useMutation({
    ...setCartItemMutation({ throwOnError: true }),
    onSuccess: (cart: CartResponse) => queryClient.setQueryData(getCartQueryKey(), cart),
  })

  if (serverCart.isPending) return <p className="text-ink/50">Loading your cart…</p>
  if (serverCart.isError) return <p className="text-red-600">Could not load your cart.</p>

  const cart = serverCart.data
  if (cart.lines.length === 0) return <EmptyCart />

  const setQuantity = (line: CartLineResponse, quantity: number) =>
    mutation.mutate({ body: { productId: line.productId, quantity } })

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-brand-50 rounded-card border border-brand-100 bg-white">
        {cart.lines.map((line) => (
          <li key={line.productId} className="flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card">
              <ProductArt category={artCategory(line.category)} seed={line.productId} className="h-full w-full" />
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                to="/products/$productId"
                params={{ productId: line.productId }}
                className="font-medium text-ink hover:text-brand-700"
              >
                {line.name}
              </Link>
              <span className="text-sm text-ink/60">
                {formatPrice(line.unitPriceMinor, line.currency)} each
                {!line.available && <span className="ml-2 text-red-600">— currently unavailable</span>}
              </span>
            </div>
            <QuantityControls
              quantity={line.quantity}
              max={line.stock}
              disabled={mutation.isPending || !line.available}
              onChange={(next) => setQuantity(line, next)}
            />
            <span className="w-20 text-right font-medium">
              {formatPrice(line.lineTotalMinor, line.currency)}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(line, 0)}
              disabled={mutation.isPending}
              className="text-sm text-ink/40 hover:text-red-600"
              aria-label={`Remove ${line.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between px-1">
        <span className="text-ink/70">Subtotal</span>
        <span className="text-xl font-bold text-brand-900">
          {formatPrice(cart.subtotalMinor, cart.currency)}
        </span>
      </div>
      <div className="flex justify-end">
        <Link
          to="/checkout"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  )
}

function GuestCart() {
  const { lines, setQuantity } = useGuestCart()

  if (lines.length === 0) return <EmptyCart />

  // Display-only math from snapshots; the server recomputes at merge/checkout.
  const estimatedTotal = lines.reduce((sum, line) => sum + line.priceSnapshotMinor * line.quantity, 0)
  const currency = lines[0]?.currency ?? 'EUR'

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-brand-50 rounded-card border border-brand-100 bg-white">
        {lines.map((line) => (
          <li key={line.productId} className="flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card">
              <ProductArt category={artCategory(line.category)} seed={line.productId} className="h-full w-full" />
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                to="/products/$productId"
                params={{ productId: line.productId }}
                className="font-medium text-ink hover:text-brand-700"
              >
                {line.name}
              </Link>
              <span className="text-sm text-ink/60">
                {formatPrice(line.priceSnapshotMinor, line.currency)} when added
              </span>
            </div>
            <QuantityControls
              quantity={line.quantity}
              onChange={(next) => setQuantity(line.productId, next)}
            />
            <span className="w-20 text-right font-medium">
              {formatPrice(line.priceSnapshotMinor * line.quantity, line.currency)}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(line.productId, 0)}
              className="text-sm text-ink/40 hover:text-red-600"
              aria-label={`Remove ${line.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between px-1">
        <span className="text-ink/70">Estimated total</span>
        <span className="text-xl font-bold text-brand-900">{formatPrice(estimatedTotal, currency)}</span>
      </div>
      <p className="text-right text-xs text-ink/40">
        Prices are confirmed at sign-in and checkout.{' '}
        <Link to="/login" className="underline hover:text-brand-700">
          Sign in
        </Link>{' '}
        to keep your cart.
      </p>
    </div>
  )
}
