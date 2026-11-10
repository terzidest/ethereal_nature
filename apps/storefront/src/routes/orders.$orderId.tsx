import { getOrderOptions, type OrderResponse } from '@ethereal-nature/api-client'
import { Art, ProductImage } from '@ethereal-nature/ui'
import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSession } from '../features/account/session'
import { formatPrice } from '../features/catalog/derive'
import { productDetailQuery } from '../features/catalog/queries'
import { OrderTimeline } from '../features/checkout/components/OrderTimeline'
import { shortOrderId } from '../features/checkout/flow'
import { formatOrderDate } from '../features/checkout/format'
import { useStartPayment } from '../features/payments/useStartPayment'

export const Route = createFileRoute('/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Order | Ethereal Nature' }] }),
  component: OrderPage,
})

/** Step 4 of 4 — the confirmation (Checkout board "Done"), which is also the order's own page. */
function OrderPage() {
  const { orderId } = Route.useParams()
  const { user, isRestoring } = useSession()
  const startPayment = useStartPayment()
  const order = useQuery({ ...getOrderOptions({ path: { id: orderId } }), enabled: user !== null })

  if (isRestoring || (user && order.isPending)) {
    return (
      <main className="mx-auto w-full max-w-[1040px] px-5 pt-16 md:px-6">
        <div className="shimmer h-80 rounded-[28px] bg-skeleton" aria-busy="true" aria-label="Loading order" />
      </main>
    )
  }

  if (!user || order.isError || !order.data) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <Art name="plate-ginkgo" className="w-[130px]" />
        <h1 className="font-display text-3xl font-semibold text-heading">Order not found</h1>
        <Link to="/account" className="text-sm font-semibold text-brand hover:text-heading">
          ← Your account
        </Link>
      </main>
    )
  }

  const data = order.data
  const paid = data.status !== 'PLACED'
  const total = formatPrice(data.totalMinor, data.currency)
  const count = data.lines.reduce((n, l) => n + l.quantity, 0)

  return (
    <main className="relative mx-auto flex w-full max-w-[1040px] flex-col items-center gap-6 px-5 pb-16 pt-8 text-center md:gap-7 md:px-6 md:pb-[120px] md:pt-[72px]">
      <span className="mote left-[8%] top-[18%] h-1.5 w-1.5 bg-amber-accent" aria-hidden="true" />
      <span className="mote left-[20%] top-[46%] h-1 w-1 bg-brand [animation-delay:-3s]" aria-hidden="true" />
      <span className="mote right-[12%] top-[22%] h-[5px] w-[5px] bg-brand [animation-delay:-5s]" aria-hidden="true" />
      <span className="mote right-[22%] top-[52%] h-1 w-1 bg-amber-accent [animation-delay:-2s]" aria-hidden="true" />

      <div className="relative h-[190px] w-[170px] md:h-[250px] md:w-[220px]">
        <Art name="parcel" eager className="absolute -top-5 left-0 w-full" />
        {paid && (
          <div className="absolute bottom-3 right-1 h-14 w-14 md:bottom-[18px] md:right-1.5 md:h-16 md:w-16" aria-hidden="true">
            <span className="ripple absolute inset-0 rounded-full bg-brand-soft" />
            <span className="absolute inset-0 grid place-items-center rounded-full border-[3px] border-surface bg-brand text-on-brand shadow-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path className="draw [animation-delay:250ms] [animation-duration:600ms]" pathLength="1" d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
          </div>
        )}
      </div>

      <span className="rise rise-1 font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">
        Step 4 of 4 · Order {shortOrderId(data.id)}
      </span>
      <h1 className="rise rise-1 font-display text-[42px] font-semibold leading-none tracking-[-0.03em] text-heading md:text-[80px]">
        {paid ? (
          <>
            Thank you — <em className="font-normal italic text-brand">it&apos;s paid.</em>
          </>
        ) : (
          <>
            Almost <em className="font-normal italic text-brand">there.</em>
          </>
        )}
      </h1>
      <p className="rise rise-2 max-w-[520px] text-base leading-relaxed text-ink-soft md:text-lg">
        {paid
          ? "Your order is paid and on its way through fulfilment. We'll pack it in a recycled kraft box with paper tape, and a sprig of lavender."
          : 'Your order is reserved, but the payment hasn’t gone through yet. Nothing was charged.'}
      </p>

      {!paid && (
        <button
          type="button"
          disabled={startPayment.isPending}
          onClick={() => startPayment.start(data.id)}
          className="rise rise-2 flex h-14 items-center gap-2.5 rounded-full bg-brand px-7 font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep disabled:opacity-70"
        >
          {startPayment.isPending && <span className="spinner" aria-hidden="true" />}
          Retry payment
        </button>
      )}

      <OrderTimeline status={data.status} />

      <LinesStrip order={data} count={count} total={total} />

      <div className="rise rise-3 flex flex-wrap justify-center gap-3">
        <a
          href="#order-details"
          className="inline-flex h-14 items-center rounded-full bg-brand px-7 font-semibold text-on-brand shadow-glow transition hover:-translate-y-px hover:bg-brand-deep"
        >
          View order
        </a>
        <Link
          to="/products"
          className="inline-flex h-14 items-center rounded-full border border-line-strong px-7 font-semibold text-heading transition hover:border-brand"
        >
          Keep browsing
        </Link>
      </div>

      <section id="order-details" aria-label="Order details" className="mt-6 w-full scroll-mt-28 text-left">
        <div className="overflow-hidden rounded-[22px] border border-line bg-surface-raised shadow-card md:rounded-[28px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4 md:px-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
              Order {shortOrderId(data.id)} · {formatOrderDate(data.placedAtEpochSeconds)}
            </span>
            <span className="text-xs text-ink-soft">A frozen snapshot — later price changes never affect it.</span>
          </div>
          <ul>
            {data.lines.map((line) => (
              <li key={line.productId} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0 md:px-6">
                <span className="min-w-0">
                  <span className="font-medium text-heading">{line.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">
                    × {line.quantity} · {formatPrice(line.unitPriceMinor, line.currency)} each
                  </span>
                </span>
                <span className="font-display text-lg font-semibold text-heading">{formatPrice(line.lineTotalMinor, line.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between bg-sand-100 px-5 py-4 md:px-6">
            <span className="text-ink-soft">Total</span>
            <span className="font-display text-2xl font-semibold text-heading">{total}</span>
          </div>
        </div>
        <Link to="/account" className="mt-4 inline-block text-sm font-semibold text-brand hover:text-heading">
          ← Your account &amp; order history
        </Link>
      </section>
    </main>
  )
}

/**
 * Thumbnails + count + total. Order lines are a frozen snapshot without
 * images, so the pictures come from the current catalog (display only; a
 * product that's gone falls back to its art).
 */
function LinesStrip({ order, count, total }: { order: OrderResponse; count: number; total: string }) {
  const shown = order.lines.slice(0, 4)
  const products = useQueries({ queries: shown.map((line) => ({ ...productDetailQuery(line.productId), retry: false })) })

  return (
    <div className="rise rise-3 flex w-full items-center justify-between gap-4 rounded-[22px] bg-sand-100 px-5 py-4 md:px-6 md:py-[18px]">
      <div className="flex items-center gap-2">
        {shown.map((line, i) => {
          const product = products[i]?.data
          return (
            <span key={line.productId} className="h-[58px] w-12 overflow-hidden rounded-xl bg-surface-raised">
              <ProductImage
                imageUrl={product?.imageUrl}
                name=""
                category={product?.category ?? 'HERBS'}
                seed={line.productId}
                className="h-full w-full"
              />
            </span>
          )
        })}
        <span className="ml-2.5 text-sm text-ink-soft">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>
      <span className="font-display text-2xl font-semibold text-heading md:text-[28px]">{total}</span>
    </div>
  )
}
