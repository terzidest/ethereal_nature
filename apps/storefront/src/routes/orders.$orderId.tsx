import { getOrderOptions } from '@ethereal-nature/api-client'
import { StatusPill } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { formatPrice } from '../features/catalog/derive'
import { formatOrderDate, orderStatusLabels } from '../features/checkout/format'
import { useStartPayment } from '../features/payments/useStartPayment'

export const Route = createFileRoute('/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Order | Ethereal Nature' }] }),
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const { user, isRestoring } = useSession()
  const startPayment = useStartPayment()
  const order = useQuery({ ...getOrderOptions({ path: { id: orderId } }), enabled: user !== null })

  if (isRestoring || (user && order.isPending)) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-ink/50">Loading order…</main>
  }

  if (!user || order.isError || !order.data) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
        <h1 className="text-2xl font-bold text-heading">Order not found</h1>
        <Link to="/account" className="text-sm font-medium text-brand hover:text-heading">
          ← Your account
        </Link>
      </main>
    )
  }

  const data = order.data
  const awaitingPayment = data.status === 'PLACED'

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-heading">
          {awaitingPayment ? 'Almost there' : 'Thank you!'}
        </h1>
        <p className="text-ink/60">
          Order <code className="text-sm">{data.id.slice(0, 8)}</code> · {formatOrderDate(data.placedAtEpochSeconds)}
        </p>
      </div>

      <StatusPill tone={awaitingPayment ? 'pending' : 'ok'}>
        {orderStatusLabels[data.status] ?? data.status}
      </StatusPill>

      {awaitingPayment && (
        <aside className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-amber-line bg-amber-wash p-4">
          <p className="text-sm text-amber-text">
            <strong>Payment pending.</strong> Your order is reserved but not paid yet.
          </p>
          <button
            type="button"
            disabled={startPayment.isPending}
            onClick={() => startPayment.start(data.id)}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-deep disabled:opacity-50"
          >
            {startPayment.isPending ? 'One moment…' : 'Complete payment'}
          </button>
        </aside>
      )}

      <ul className="divide-y divide-line rounded-card border border-line bg-surface-raised">
        {data.lines.map((line) => (
          <li key={line.productId} className="flex items-center justify-between gap-4 p-4">
            <span>
              {line.name} <span className="text-ink/50">× {line.quantity}</span>
              <span className="ml-2 text-sm text-ink/50">
                ({formatPrice(line.unitPriceMinor, line.currency)} each)
              </span>
            </span>
            <span className="font-medium">{formatPrice(line.lineTotalMinor, line.currency)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between px-1">
        <span className="text-ink/70">Total</span>
        <span className="text-2xl font-bold text-heading">{formatPrice(data.totalMinor, data.currency)}</span>
      </div>

      <p className="text-sm text-ink/50">
        This order is a frozen snapshot — later price changes never affect it.
      </p>
      <Link to="/account" className="text-sm font-medium text-brand hover:text-heading">
        ← Your account & order history
      </Link>
    </main>
  )
}
