import { listAllOrdersOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { formatOrderDate, formatPrice, statusTone } from '../../../features/orders/derive'
import {
  ORDER_STATUSES,
  PAGE_SIZES,
  pageOf,
  pageSizeOf,
  validateOrdersTableSearch,
  type OrdersTableSearch,
} from '../../../features/orders/search'

function ordersQuery(search: OrdersTableSearch) {
  return listAllOrdersOptions({
    query: { page: pageOf(search), pageSize: pageSizeOf(search), status: search.status },
  })
}

export const Route = createFileRoute('/_authed/orders/')({
  validateSearch: validateOrdersTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(ordersQuery(deps)),
  component: OrdersPage,
})

function OrdersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/orders/' })
  const { data, isFetching } = useQuery(ordersQuery(search))

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Orders</h1>
        <span className="text-sm text-ink/50">
          {data ? `${data.totalItems} orders` : ''} {isFetching ? '· refreshing…' : ''}
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={search.status ?? ''}
          onChange={(event) => {
            const value = event.target.value
            void navigate({
              search: (prev) => ({
                ...prev,
                status: ORDER_STATUSES.find((s) => s === value),
                page: undefined,
              }),
            })
          }}
          className="rounded border border-brand-100 bg-white px-3 py-1.5 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={pageSizeOf(search)}
          onChange={(event) => {
            const pageSize = Number(event.target.value)
            void navigate({
              search: (prev) => ({
                ...prev,
                pageSize: pageSize === 25 ? undefined : pageSize,
                page: undefined,
              }),
            })
          }}
          className="ml-auto rounded border border-brand-100 bg-white px-3 py-1.5 text-sm"
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-brand-100 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left">
              <th className="px-3 py-2 font-semibold text-ink/70">Order</th>
              <th className="px-3 py-2 font-semibold text-ink/70">Placed</th>
              <th className="px-3 py-2 font-semibold text-ink/70">Status</th>
              <th className="px-3 py-2 text-right font-semibold text-ink/70">Items</th>
              <th className="px-3 py-2 text-right font-semibold text-ink/70">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((order) => (
              <tr key={order.id} className="border-b border-brand-50 hover:bg-brand-50/50">
                <td className="px-3 py-2.5">
                  <Link
                    to="/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="font-medium text-brand-700 hover:text-brand-900"
                  >
                    {order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2.5">{formatOrderDate(order.placedAtEpochSeconds)}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">{order.lines.length}</td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {formatPrice(order.totalMinor, order.currency)}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-ink/50">
                  No orders{search.status ? ` with status ${search.status}` : ' yet'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <nav className="flex items-center justify-end gap-4 text-sm" aria-label="Pagination">
          {pageOf(search) > 1 ? (
            <Link to="/orders" search={{ ...search, page: pageOf(search) - 1 === 1 ? undefined : pageOf(search) - 1 }} className="font-medium text-brand-700 hover:text-brand-900">
              ← Prev
            </Link>
          ) : (
            <span className="text-ink/30">← Prev</span>
          )}
          <span className="text-ink/60">
            Page {data.page} / {data.totalPages}
          </span>
          {pageOf(search) < data.totalPages ? (
            <Link to="/orders" search={{ ...search, page: pageOf(search) + 1 }} className="font-medium text-brand-700 hover:text-brand-900">
              Next →
            </Link>
          ) : (
            <span className="text-ink/30">Next →</span>
          )}
        </nav>
      )}
    </main>
  )
}
