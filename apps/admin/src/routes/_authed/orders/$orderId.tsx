import {
  getOrderOptions,
  getOrderQueryKey,
  transitionOrderStatusMutation,
} from '@ethereal-nature/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useIsViewer } from '../../../features/auth/viewer'
import { formatOrderDate, formatPrice, nextStatus, statusTone } from '../../../features/orders/derive'

export const Route = createFileRoute('/_authed/orders/$orderId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getOrderOptions({ path: { id: params.orderId } })),
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const isViewer = useIsViewer()
  const queryClient = useQueryClient()
  const order = useQuery(getOrderOptions({ path: { id: orderId } }))
  // Cancelling takes two clicks: an inline confirm instead of a browser dialog.
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const transition = useMutation({
    ...transitionOrderStatusMutation({ throwOnError: true }),
    onSuccess: (updated) => {
      setConfirmingCancel(false)
      queryClient.setQueryData(getOrderQueryKey({ path: { id: orderId } }), updated)
      // Every page/filter variant of the admin list is stale now.
      void queryClient.invalidateQueries({
        predicate: (query) =>
          (query.queryKey[0] as { _id?: string } | undefined)?._id === 'listAllOrders',
      })
    },
    // 409: it changed underneath us (paid, or released by the expiry sweep). Show what it is now.
    onError: () => {
      setConfirmingCancel(false)
      void queryClient.invalidateQueries({ queryKey: getOrderQueryKey({ path: { id: orderId } }) })
    },
  })

  if (order.isPending) return <main className="max-w-4xl px-6 py-8 text-ink/50 lg:px-8">Loading…</main>
  if (order.isError || !order.data) {
    return (
      <main className="flex max-w-4xl flex-col items-start gap-4 px-6 py-8 lg:px-8">
        <p className="text-red-600">Order not found.</p>
        <Link to="/orders" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          ← All orders
        </Link>
      </main>
    )
  }

  const data = order.data
  const advance = nextStatus[data.status]

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-6 py-8 lg:px-8">
      <Link to="/orders" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← All orders
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">
          Order <code className="text-xl">{data.id.slice(0, 8)}</code>
        </h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusTone[data.status]}`}>
          {data.status}
        </span>
        {advance && (
          <button
            type="button"
            disabled={isViewer || transition.isPending}
            title={isViewer ? 'Read-only demo' : undefined}
            onClick={() => transition.mutate({ path: { id: data.id }, body: { status: advance } })}
            className="ml-auto rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {transition.isPending ? 'Updating…' : `Mark as ${advance}`}
          </button>
        )}
        {data.status === 'PLACED' &&
          (confirmingCancel ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-ink/70">Cancel and return its stock?</span>
              <button
                type="button"
                disabled={transition.isPending}
                onClick={() => transition.mutate({ path: { id: data.id }, body: { status: 'CANCELLED' } })}
                className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Yes, cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirmingCancel(false)}
                className="rounded-full px-3 py-2 font-medium text-ink/70 hover:text-ink"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={isViewer || transition.isPending}
              title={isViewer ? 'Read-only demo' : undefined}
              onClick={() => setConfirmingCancel(true)}
              className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              Cancel order
            </button>
          ))}
      </header>

      {transition.isError && (
        <p role="alert" className="text-sm text-red-600">
          The order changed before this went through. It now shows its current status.
        </p>
      )}

      <dl className="flex gap-8 text-sm text-ink/70">
        <div>
          <dt className="font-medium text-ink">Placed</dt>
          <dd>{formatOrderDate(data.placedAtEpochSeconds)}</dd>
        </div>
        {data.paymentDueAtEpochSeconds && (
          <div>
            <dt className="font-medium text-ink">Released if unpaid</dt>
            <dd>{formatOrderDate(data.paymentDueAtEpochSeconds)}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-ink">Customer</dt>
          <dd>
            <code>{data.userId.slice(0, 8)}</code>
          </dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-card border border-brand-100 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left">
              <th className="px-3 py-2 font-semibold text-ink/70">Item</th>
              <th className="px-3 py-2 text-right font-semibold text-ink/70">Unit price</th>
              <th className="px-3 py-2 text-right font-semibold text-ink/70">Qty</th>
              <th className="px-3 py-2 text-right font-semibold text-ink/70">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line) => (
              <tr key={line.productId} className="border-b border-brand-50">
                <td className="px-3 py-2.5 font-medium text-ink">{line.name}</td>
                <td className="px-3 py-2.5 text-right">{formatPrice(line.unitPriceMinor, line.currency)}</td>
                <td className="px-3 py-2.5 text-right">{line.quantity}</td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {formatPrice(line.lineTotalMinor, line.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-3 py-3 text-right font-medium text-ink/70">
                Total
              </td>
              <td className="px-3 py-3 text-right text-lg font-bold text-brand-900">
                {formatPrice(data.totalMinor, data.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-sm text-ink/40">
        Order contents are a frozen snapshot and cannot be edited — only the fulfillment status advances
        (PLACED → PAID → PACKED → SHIPPED). An unpaid order can be cancelled, which returns its stock; unpaid
        orders are also cancelled automatically when their payment window closes.
      </p>
    </main>
  )
}
