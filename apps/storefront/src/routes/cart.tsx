import { Art, useMagnetic } from '@ethereal-nature/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { formatPrice } from '../features/catalog/derive'
import { PRODUCT_COPY } from '../features/catalog/copy'
import { AddOns } from '../features/cart/components/AddOns'
import { AdjustmentsBanner } from '../features/cart/components/AdjustmentsBanner'
import { BasketLines } from '../features/cart/components/BasketLines'
import { UndoToast } from '../features/cart/components/UndoToast'
import { shelfChanges, useBasket, type BasketLine } from '../features/cart/useBasket'
import { Rolling, SummaryPanel } from '../features/checkout/components/SummaryPanel'
import { StepProgress } from '../features/checkout/components/CheckoutSteps'
import { ArrowIcon, LockIcon } from '../features/checkout/components/icons'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Basket | Ethereal Nature' }] }),
  component: BasketPage,
})

/** Step 1 of 4 (Cart / Mobile Cart boards). */
function BasketPage() {
  const basket = useBasket()
  const [removed, setRemoved] = useState<BasketLine | null>(null)
  const closeToast = useCallback(() => setRemoved(null), [])
  const magnet = useMagnetic(10)

  const countLabel = `${basket.itemCount} ${basket.itemCount === 1 ? 'item' : 'items'}`
  const subtotal = formatPrice(basket.subtotalMinor, basket.currency)
  const empty = !basket.isLoading && basket.lines.length === 0
  const blocked = basket.lines.some((l) => !l.available)

  const remove = (line: BasketLine) => {
    basket.setQuantity(line.productId, 0)
    setRemoved(line)
  }

  return (
    <main className="relative mx-auto w-full max-w-[1240px] px-5 pb-10 pt-[18px] md:px-6 md:pb-[120px] md:pt-16">
      <div className="rise flex flex-col gap-3.5">
        <StepProgress current={0} label={countLabel} />
        <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[76px] md:leading-none">
          Your <em className="font-normal italic md:text-brand">basket.</em>
        </h1>
      </div>

      {basket.isError ? (
        <p className="mt-10 text-danger">Could not load your basket.</p>
      ) : empty ? (
        <EmptyBasket />
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 md:mt-11 md:grid-cols-[minmax(0,1fr)_360px] md:gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex flex-col gap-5">
            <AdjustmentsBanner shelf={shelfChanges(basket.lines)} />
            {basket.isLoading ? (
              <div className="shimmer h-60 rounded-[28px] bg-skeleton" aria-busy="true" aria-label="Loading your basket" />
            ) : (
              <BasketLines
                lines={basket.lines}
                disabled={basket.isUpdating}
                onQuantity={(line, quantity) => basket.setQuantity(line.productId, quantity)}
                onRemove={remove}
              />
            )}
            <AddOns inBasket={new Set(basket.lines.map((l) => l.productId))} />
          </div>

          <aside aria-label="Order summary" className="hidden flex-col gap-4 md:sticky md:top-28 md:flex">
            <SummaryPanel eyebrow="Summary" itemCount={basket.itemCount} itemsTotal={subtotal} total={subtotal}>
              <Link
                to="/checkout"
                disabled={blocked}
                {...magnet.bind}
                style={magnet.style}
                className="relative flex h-[60px] items-center justify-center gap-2.5 rounded-full bg-[#7DD3A0] font-semibold text-[#0A130F] shadow-[0_10px_30px_rgb(125_211_160/0.35)] transition-[background-color] hover:bg-[#8fdcae] aria-disabled:opacity-50"
              >
                Continue to checkout
                <ArrowIcon />
              </Link>
              {!basket.isAuthenticated && (
                <span className="relative flex items-center gap-2 text-xs text-[#EEF4EF]/60">
                  <LockIcon />
                  Sign in at the next step — your basket comes with you.
                </span>
              )}
            </SummaryPanel>
            <ul className="grid grid-cols-3 gap-2.5 text-xs text-ink-soft">
              {PRODUCT_COPY.perks.map((perk) => (
                <li key={perk} className="flex flex-col gap-1.5 rounded-2xl bg-sand-100 p-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>
          </aside>

          {/* Phones: summary detail in the page; the total rides in the sticky bar. */}
          <div className="flex flex-col gap-2.5 rounded-[22px] bg-sand-100 p-[18px] text-sm md:hidden">
            <div className="flex justify-between">
              <span className="text-ink-soft">Items ({basket.itemCount})</span>
              <span className="text-heading">{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Packaging</span>
              <span className="text-heading">Plastic-free</span>
            </div>
            {!basket.isAuthenticated && (
              <span className="pt-1 text-xs text-ink-soft">Sign in at the next step — your basket comes with you.</span>
            )}
          </div>
        </div>
      )}

      {!empty && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3.5 border-t border-line bg-glass px-4 pb-[max(env(safe-area-inset-bottom),22px)] pt-3 backdrop-blur-[16px] backdrop-saturate-[1.4] md:hidden">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-soft">Total</span>
            <Rolling value={subtotal} height="h-7" className="font-display text-[22px] font-semibold leading-7 text-heading" />
          </div>
          <Link
            to="/checkout"
            disabled={blocked}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-on-brand shadow-glow transition active:scale-[0.97] aria-disabled:opacity-50"
          >
            Continue
            <ArrowIcon />
          </Link>
        </div>
      )}

      {removed && <UndoToast name={removed.name} onUndo={() => (basket.restore(removed), setRemoved(null))} onClose={closeToast} />}
    </main>
  )
}

function EmptyBasket() {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-[28px] border border-line bg-surface-raised px-6 pb-16 pt-10 text-center shadow-card md:mt-11">
      <Art name="plate-sage" className="w-[130px] md:w-[160px]" />
      <p className="font-display text-[26px] font-semibold text-heading md:text-[30px]">Your basket is resting</p>
      <p className="text-ink-soft">Nothing in it yet. The herbs are a good place to start.</p>
      <Link
        to="/products"
        className="mt-1.5 inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-on-brand transition hover:bg-brand-deep"
      >
        Back to the shop
      </Link>
    </div>
  )
}
