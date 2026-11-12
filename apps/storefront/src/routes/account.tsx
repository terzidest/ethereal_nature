import { getMyOrdersOptions, type OrderStatusDto } from '@ethereal-nature/api-client'
import { Art } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { formatPrice } from '../features/catalog/derive'
import { shortOrderId } from '../features/checkout/flow'
import { formatOrderDate, orderStatusLabels } from '../features/checkout/format'

export const Route = createFileRoute('/account')({
  head: () => ({ meta: [{ title: 'Account | Ethereal Nature' }] }),
  component: AccountPage,
})

/** Not on the boards: the existing account page, restyled with the redesign tokens. */
function AccountPage() {
  const { user, isRestoring, logout } = useSession()
  const navigate = useNavigate()

  if (isRestoring) {
    return (
      <main className="mx-auto w-full max-w-[1040px] px-5 pt-16 md:px-6">
        <div className="shimmer h-64 rounded-[28px] bg-skeleton" aria-busy="true" aria-label="Loading your account" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-[1040px] flex-col items-start gap-4 px-5 pb-24 pt-8 md:px-6 md:pt-20">
        <span className="rise font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">Your account</span>
        <h1 className="rise rise-1 font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[68px] md:leading-none">
          Sign in to see <em className="font-normal italic text-brand">your orders.</em>
        </h1>
        <p className="rise rise-2 max-w-[460px] text-ink-soft md:text-lg">Your order history and a basket that follows you live here.</p>
        <div className="rise rise-3 mt-2 flex flex-wrap gap-3">
          <Link
            to="/login"
            search={{ redirect: '/account' }}
            className="inline-flex h-[52px] items-center rounded-full bg-brand px-7 font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            search={{ redirect: '/account' }}
            className="inline-flex h-[52px] items-center rounded-full border border-line-strong px-7 font-semibold text-heading transition hover:border-brand"
          >
            Create an account
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-[1040px] grid-cols-[minmax(0,1fr)] items-start gap-6 px-5 pb-16 pt-8 md:grid-cols-[minmax(0,1fr)_300px] md:gap-10 md:px-6 md:pb-[120px] md:pt-20">
      <div className="flex flex-col gap-3 md:col-span-2">
        <span className="rise font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">Your account</span>
        <h1 className="rise rise-1 font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[68px] md:leading-none">
          Your <em className="font-normal italic text-brand">orders.</em>
        </h1>
      </div>

      <OrderHistory />

      <aside className="rise rise-2 flex flex-col gap-4 rounded-[22px] border border-line bg-surface-raised p-5 md:sticky md:top-28 md:rounded-[28px] md:p-6" aria-label="Account">
        <div className="flex items-center gap-3.5">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-soft font-semibold uppercase text-brand" aria-hidden="true">
            {user.email.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand">Signed in</span>
            <span className="truncate font-medium text-heading">{user.email}</span>
          </div>
        </div>
        {user.role !== 'CUSTOMER' && (
          <span className="self-start rounded-full bg-sand-100 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            {user.role.toLowerCase()}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            logout()
            void navigate({ to: '/' })
          }}
          className="h-11 rounded-full border border-line-strong text-sm font-semibold text-heading transition hover:border-brand"
        >
          Sign out
        </button>
      </aside>
    </main>
  )
}

/** Status chip colour: settled steps in brand, waiting-for-payment in amber, cancelled in neutral. */
const STATUS_TONE: Record<OrderStatusDto, string> = {
  PLACED: 'bg-amber-wash text-amber-text',
  PAID: 'bg-brand-soft text-brand',
  PACKED: 'bg-brand-soft text-brand',
  SHIPPED: 'bg-brand text-on-brand',
  CANCELLED: 'bg-sand-100 text-ink-soft',
}

function OrderHistory() {
  const orders = useQuery(getMyOrdersOptions())

  if (orders.isPending) {
    return <div className="shimmer h-56 rounded-[28px] bg-skeleton" aria-busy="true" aria-label="Loading orders" />
  }
  if (orders.isError) return <p className="text-danger">Could not load your orders.</p>

  if (orders.data.length === 0) {
    return (
      <section className="rise rise-2 flex flex-col items-center gap-3 rounded-[28px] border border-line bg-surface-raised px-6 pb-12 pt-8 text-center shadow-card">
        <Art name="plate-sage" className="w-[120px]" />
        <p className="font-display text-2xl font-semibold text-heading">No orders yet</p>
        <p className="text-ink-soft">When you place one, it shows up here — every line frozen as you bought it.</p>
        <Link to="/products" className="mt-1 inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-on-brand transition hover:bg-brand-deep">
          Browse the shop
        </Link>
      </section>
    )
  }

  return (
    <section aria-label="Order history" className="rise rise-2 overflow-hidden rounded-[22px] border border-line bg-surface-raised shadow-card md:rounded-[28px]">
      <div className="border-b border-line px-5 py-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft md:px-6">
        {orders.data.length} {orders.data.length === 1 ? 'order' : 'orders'}
      </div>
      <ul>
        {orders.data.map((order) => {
          const count = order.lines.reduce((n, l) => n + l.quantity, 0)
          return (
            <li key={order.id} className="border-b border-line last:border-b-0">
              <Link
                to="/orders/$orderId"
                params={{ orderId: order.id }}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-brand-soft/50 md:px-6 md:py-5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-sm text-heading">{shortOrderId(order.id)}</code>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[order.status]}`}>
                      {order.status === 'PLACED' ? 'Awaiting payment' : (orderStatusLabels[order.status] ?? order.status)}
                    </span>
                  </span>
                  <span className="text-sm text-ink-soft">
                    {formatOrderDate(order.placedAtEpochSeconds)} · {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <span className="font-display text-xl font-semibold text-heading">{formatPrice(order.totalMinor, order.currency)}</span>
                <svg className="text-ink-soft transition group-hover:translate-x-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
