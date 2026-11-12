import {
  getMyOrdersQueryKey,
  getOrderQueryKey,
  getPaymentIntentOptions,
  getPaymentIntentQueryKey,
  simulatePaymentMutation,
} from '@ethereal-nature/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { formatPrice } from '../features/catalog/derive'
import { shortOrderId } from '../features/checkout/flow'
import { intentStatusCopy } from '../features/payments/format'
import { useStartPayment } from '../features/payments/useStartPayment'

export const Route = createFileRoute('/pay/$intentId')({
  head: () => ({ meta: [{ title: 'Payment | Ethereal Nature' }] }),
  component: PayPage,
})

/**
 * Step 3 of 4 — the mock provider's hosted page (Checkout board "Pay").
 * Deliberately not shop chrome: a neutral white card in both themes, the
 * way a real provider page would look.
 */
function PayPage() {
  const { intentId } = Route.useParams()
  const { user, isRestoring } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const retry = useStartPayment()
  const intent = useQuery({
    ...getPaymentIntentOptions({ path: { id: intentId } }),
    enabled: user !== null,
  })

  const simulate = useMutation({
    ...simulatePaymentMutation({ throwOnError: true }),
    onSuccess: (settled) => {
      queryClient.setQueryData(getPaymentIntentQueryKey({ path: { id: intentId } }), settled)
      // The order's status (and the history list) may have flipped to PAID.
      void queryClient.invalidateQueries({ queryKey: getOrderQueryKey({ path: { id: settled.orderId } }) })
      void queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() })
      if (settled.status === 'SUCCEEDED') {
        void navigate({ to: '/orders/$orderId', params: { orderId: settled.orderId } })
      }
    },
    // Refused: the order was cancelled before the payment went through
    // (ADR-0012). Its own page explains that; nothing was charged.
    onError: () => {
      const orderId = intent.data?.orderId
      if (!orderId) return
      void queryClient.invalidateQueries({ queryKey: getOrderQueryKey({ path: { id: orderId } }) })
      void queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() })
      void navigate({ to: '/orders/$orderId', params: { orderId } })
    },
  })

  if (isRestoring || (user && intent.isPending)) {
    return (
      <main className="flex flex-col items-center px-5 pb-24 pt-20">
        <div className="shimmer h-[360px] w-full max-w-[480px] rounded-3xl bg-skeleton" aria-busy="true" aria-label="Loading payment" />
      </main>
    )
  }

  if (!user || intent.isError || !intent.data) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-heading">Payment not found</h1>
        <Link to="/account" className="text-sm font-semibold text-brand hover:text-heading">
          ← Your account
        </Link>
      </main>
    )
  }

  const data = intent.data
  const copy = intentStatusCopy[data.status]
  const amount = formatPrice(data.amountMinor, data.currency)
  const declined = data.status === 'FAILED'
  const paying = simulate.isPending

  return (
    <main className="flex flex-col items-center gap-5 px-5 pb-16 pt-8 md:px-6 md:pb-[120px] md:pt-20">
      <span className="rise text-center font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">
        Step 3 of 4 · You&apos;re on the payment provider&apos;s page
      </span>
      <section
        // The key remounts the card when it flips to declined, so the shake plays.
        key={data.status}
        aria-label="Ethereal Pay"
        className={`rise rise-1 flex w-full max-w-[480px] flex-col gap-6 rounded-3xl bg-white p-7 text-[#1A1D21] shadow-[0_30px_80px_rgb(10_20_15/0.18),0_0_0_1px_rgb(10_20_15/0.06)] md:p-9 ${declined ? 'shake' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.01em]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1A1D21] text-[13px] text-white" aria-hidden="true">
              E
            </span>
            Ethereal Pay
          </span>
          <span className="rounded-full bg-[#F1F2F4] px-2.5 py-1 text-xs font-medium text-[#5A606B]">demo provider</span>
        </div>

        <div className="flex flex-col gap-1.5" role={declined ? 'alert' : undefined}>
          <h1 className="text-2xl font-bold tracking-[-0.01em]">{copy.heading}</h1>
          <p className="text-sm text-[#5A606B]">{copy.note}</p>
        </div>

        <div className="flex items-baseline justify-between rounded-[14px] bg-[#F6F7F8] px-[18px] py-4">
          <span className="text-sm text-[#5A606B]">
            Order <code className="font-mono text-[#1A1D21]">{shortOrderId(data.orderId)}</code>
          </span>
          <span className="text-[28px] font-bold">{amount}</span>
        </div>

        {data.status === 'CREATED' && (
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={paying}
              aria-busy={paying}
              onClick={() => simulate.mutate({ path: { id: data.id }, body: { outcome: 'PAY' } })}
              className="flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-xl bg-[#1A1D21] text-[15px] font-semibold text-white transition hover:bg-black disabled:opacity-80"
            >
              {paying && <span className="spinner" aria-hidden="true" />}
              {paying ? 'Processing…' : `Pay ${amount}`}
            </button>
            <button
              type="button"
              disabled={paying}
              onClick={() => simulate.mutate({ path: { id: data.id }, body: { outcome: 'DECLINE' } })}
              className="h-[52px] rounded-xl border border-[#DADDE2] bg-white px-5 text-[15px] font-semibold text-[#3A3F47] transition hover:bg-[#F6F7F8] disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        )}

        {declined && (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={retry.isPending}
              onClick={() => retry.start(data.orderId)}
              className="flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#1A1D21] text-[15px] font-semibold text-white transition hover:bg-black disabled:opacity-80"
            >
              {retry.isPending && <span className="spinner" aria-hidden="true" />}
              Retry payment
            </button>
            <Link
              to="/orders/$orderId"
              params={{ orderId: data.orderId }}
              className="flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-[#3A3F47] hover:bg-[#F6F7F8]"
            >
              Back to your order
            </Link>
          </div>
        )}

        {data.status === 'SUCCEEDED' && (
          <Link
            to="/orders/$orderId"
            params={{ orderId: data.orderId }}
            className="flex h-[52px] items-center justify-center rounded-xl bg-[#1A1D21] text-[15px] font-semibold text-white"
          >
            Back to your order
          </Link>
        )}

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#8A909A]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Signed webhook back to the shop
        </div>
      </section>
      <p className="rise rise-2 max-w-[480px] text-center text-[13px] leading-relaxed text-ink-soft">
        Payments are simulated end to end: this page drives a mock provider that signs a webhook back to the shop.
      </p>
    </main>
  )
}
