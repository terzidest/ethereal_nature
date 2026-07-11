import {
  getCartQueryKey,
  placeOrderMutation,
  type CheckoutRejectionResponse,
} from '@ethereal-nature/api-client'
import { ProductArt } from '@ethereal-nature/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useSession } from '../features/account/session'
import { formatPrice } from '../features/catalog/derive'
import { artCategory } from '../features/cart/art'
import { useCartSummary } from '../features/cart/useCartSummary'
import { useStartPayment } from '../features/payments/useStartPayment'

export const Route = createFileRoute('/checkout')({
  head: () => ({ meta: [{ title: 'Checkout | Ethereal Nature' }] }),
  component: CheckoutPage,
})

function isRejection(error: unknown): error is CheckoutRejectionResponse {
  return typeof error === 'object' && error !== null && 'currentTotalMinor' in error
}

function CheckoutPage() {
  const { user, isRestoring } = useSession()
  const { serverCart } = useCartSummary()
  const queryClient = useQueryClient()
  const startPayment = useStartPayment()
  const [rejection, setRejection] = useState<CheckoutRejectionResponse | null>(null)

  const mutation = useMutation({
    ...placeOrderMutation({ throwOnError: true }),
    onSuccess: (order) => {
      setRejection(null)
      void queryClient.invalidateQueries({ queryKey: getCartQueryKey() })
      // The order is placed either way; payment continues on the provider page
      // (or, if intent creation fails, from the order page).
      startPayment.start(order.id)
    },
    onError: (error) => {
      if (isRejection(error)) {
        // Final re-validation found changes: refresh the cart to server
        // truth and let the user confirm the new state (ADR-0007).
        setRejection(error)
        void queryClient.invalidateQueries({ queryKey: getCartQueryKey() })
      }
    },
  })

  if (isRestoring) return <main className="mx-auto max-w-2xl px-6 py-24 text-ink/50">Loading…</main>

  if (!user) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
        <h1 className="text-2xl font-bold text-brand-900">Sign in to check out</h1>
        <p className="text-ink/70">Your guest cart comes with you — we merge it when you sign in.</p>
        <Link
          to="/login"
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Sign in
        </Link>
      </main>
    )
  }

  const cart = serverCart.data
  if (serverCart.isPending) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-ink/50">Loading your cart…</main>
  }
  if (!cart || cart.lines.length === 0) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
        <h1 className="text-2xl font-bold text-brand-900">Nothing to check out</h1>
        <Link to="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          ← Back to the shop
        </Link>
      </main>
    )
  }

  const unavailable = cart.lines.some((line) => !line.available)

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900">Checkout</h1>

      {rejection && (
        <aside className="flex flex-col gap-2 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Your cart changed while you were checking out — please review and confirm again.</strong>
          <ul className="list-disc pl-5">
            {rejection.issues.map((issue) => (
              <li key={issue.productId}>
                {issue.name ?? 'An item'}{' '}
                {issue.kind === 'UNAVAILABLE'
                  ? 'is no longer available.'
                  : `has only ${issue.availableStock} in stock (you wanted ${issue.requestedQuantity}).`}
              </li>
            ))}
            {rejection.issues.length === 0 && (
              <li>The total is now {formatPrice(rejection.currentTotalMinor, cart.currency)}.</li>
            )}
          </ul>
        </aside>
      )}

      <ul className="divide-y divide-brand-50 rounded-card border border-brand-100 bg-white">
        {cart.lines.map((line) => (
          <li key={line.productId} className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-card">
              <ProductArt category={artCategory(line.category)} seed={line.productId} className="h-full w-full" />
            </div>
            <span className="flex-1">
              {line.name} <span className="text-ink/50">× {line.quantity}</span>
              {!line.available && <span className="ml-2 text-sm text-red-600">unavailable</span>}
            </span>
            <span className="font-medium">{formatPrice(line.lineTotalMinor, line.currency)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between px-1">
        <span className="text-ink/70">Total</span>
        <span className="text-2xl font-bold text-brand-900">
          {formatPrice(cart.subtotalMinor, cart.currency)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={mutation.isPending || startPayment.isPending || unavailable}
          onClick={() => mutation.mutate({ body: { expectedTotalMinor: cart.subtotalMinor } })}
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {mutation.isPending || startPayment.isPending
            ? 'Placing order…'
            : `Place order · ${formatPrice(cart.subtotalMinor, cart.currency)}`}
        </button>
        <Link to="/cart" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          Back to cart
        </Link>
      </div>
      {unavailable && (
        <p className="text-sm text-red-600">Remove unavailable items in your cart before checking out.</p>
      )}
      <p className="text-xs text-ink/40">Demo shop — payment is simulated on the next step.</p>
    </main>
  )
}
