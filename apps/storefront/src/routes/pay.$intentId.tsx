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
import { intentStatusCopy } from '../features/payments/format'

export const Route = createFileRoute('/pay/$intentId')({
  head: () => ({ meta: [{ title: 'Payment | Ethereal Nature' }] }),
  component: PayPage,
})

function PayPage() {
  const { intentId } = Route.useParams()
  const { user, isRestoring } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
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
  })

  if (isRestoring || (user && intent.isPending)) {
    return <main className="mx-auto max-w-md px-6 py-24 text-ink/50">Loading payment…</main>
  }

  if (!user || intent.isError || !intent.data) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-24">
        <h1 className="text-2xl font-bold text-brand-900">Payment not found</h1>
        <Link to="/account" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          ← Your account
        </Link>
      </main>
    )
  }

  const data = intent.data
  const copy = intentStatusCopy[data.status]

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      {/* Styled as the provider's hosted page — deliberately not shop chrome. */}
      <div className="flex flex-col gap-5 rounded-tile border border-brand-100 bg-white p-8 shadow-card">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-brand-900">Ethereal Pay</span>
          <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-medium text-ink/60">
            demo provider
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-brand-900">{copy.heading}</h1>
          <p className="text-sm text-ink/60">{copy.note}</p>
        </div>

        <div className="flex items-baseline justify-between rounded-card bg-brand-50/60 px-4 py-3">
          <span className="text-sm text-ink/70">
            Order <code>{data.orderId.slice(0, 8)}</code>
          </span>
          <span className="text-2xl font-bold text-brand-900">
            {formatPrice(data.amountMinor, data.currency)}
          </span>
        </div>

        {data.status === 'CREATED' ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate({ path: { id: data.id }, body: { outcome: 'PAY' } })}
              className="flex-1 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {simulate.isPending ? 'Processing…' : `Pay ${formatPrice(data.amountMinor, data.currency)}`}
            </button>
            <button
              type="button"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate({ path: { id: data.id }, body: { outcome: 'DECLINE' } })}
              className="rounded-full bg-sand-100 px-5 py-3 text-sm font-semibold text-ink/70 transition hover:bg-sand-200 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : (
          <Link
            to="/orders/$orderId"
            params={{ orderId: data.orderId }}
            className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Back to your order
          </Link>
        )}
      </div>

      <p className="text-center text-xs text-ink/40">
        Payments are simulated end-to-end: this page drives a mock provider that signs a webhook
        back to the shop.
      </p>
    </main>
  )
}
