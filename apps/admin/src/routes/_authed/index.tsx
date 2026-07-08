import {
  getHealthOptions,
  listAdminProductsOptions,
  listAllOrdersOptions,
} from '@ethereal-nature/api-client'
import { StatusPill } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageHeader } from '../../components/PageHeader'
import { formatOrderDate, formatPrice, statusTone } from '../../features/orders/derive'

export const Route = createFileRoute('/_authed/')({
  component: Dashboard,
})

function Dashboard() {
  // Count probes: only totalItems matters, so fetch the smallest page the API allows.
  const products = useQuery(listAdminProductsOptions({ query: { page: 1, pageSize: 1 } }))
  const placed = useQuery(listAllOrdersOptions({ query: { page: 1, pageSize: 1, status: 'PLACED' } }))
  // Doubles as the total-orders count and the recent-orders list.
  const orders = useQuery(listAllOrdersOptions({ query: { page: 1, pageSize: 5 } }))
  const health = useQuery(getHealthOptions())

  const healthTone = health.isPending
    ? 'pending'
    : health.isError || health.data?.database !== 'up'
      ? 'error'
      : 'ok'

  return (
    <main className="flex flex-col gap-6 px-6 py-8 lg:px-8">
      <PageHeader title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Products" value={products.data?.totalItems} to="/products" />
        <StatCard label="Orders" value={orders.data?.totalItems} to="/orders" />
        <StatCard
          label="Awaiting payment"
          value={placed.data?.totalItems}
          to="/orders"
          search={{ status: 'PLACED' }}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Recent orders</h2>
          <Link to="/orders" className="text-sm font-medium text-brand-700 hover:text-brand-900">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-card border border-brand-100 bg-white">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {orders.data?.items.map((order) => (
                <tr key={order.id} className="border-b border-brand-50 last:border-b-0 hover:bg-brand-50/50">
                  <td className="px-3 py-2.5">
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="font-medium text-brand-700 hover:text-brand-900"
                    >
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-ink/70">{formatOrderDate(order.placedAtEpochSeconds)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium">
                    {formatPrice(order.totalMinor, order.currency)}
                  </td>
                </tr>
              ))}
              {orders.data && orders.data.items.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-ink/50">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-auto">
        <StatusPill tone={healthTone}>
          {health.isPending
            ? 'Checking backend…'
            : health.isError
              ? 'Backend unreachable'
              : `API ${health.data.status} · database ${health.data.database}`}
        </StatusPill>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  to,
  search,
}: {
  label: string
  value: number | undefined
  to: '/products' | '/orders'
  search?: { status: 'PLACED' }
}) {
  return (
    <Link
      to={to}
      search={search}
      className="flex flex-col gap-1 rounded-card border border-brand-100 bg-white px-5 py-4 transition hover:border-brand-300"
    >
      <span className="text-sm font-medium text-ink/60">{label}</span>
      <span className="text-3xl font-bold tracking-tight text-brand-900">{value ?? '—'}</span>
    </Link>
  )
}
