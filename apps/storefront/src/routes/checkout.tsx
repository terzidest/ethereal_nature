import {
  getCartQueryKey,
  placeOrderMutation,
  setCartItem,
  type CartResponse,
  type CheckoutRejectionResponse,
} from '@ethereal-nature/api-client'
import { ProductImage, useMagnetic } from '@ethereal-nature/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useSession } from '../features/account/session'
import { categoryLabel, formatPrice } from '../features/catalog/derive'
import { artCategory } from '../features/cart/art'
import { AdjustmentsBanner } from '../features/cart/components/AdjustmentsBanner'
import { shelfChanges, useBasket, type BasketLine } from '../features/cart/useBasket'
import { StepProgress } from '../features/checkout/components/CheckoutSteps'
import { SummaryPanel } from '../features/checkout/components/SummaryPanel'
import { useStartPayment } from '../features/payments/useStartPayment'

export const Route = createFileRoute('/checkout')({
  head: () => ({ meta: [{ title: 'Checkout | Ethereal Nature' }] }),
  component: CheckoutPage,
})

function isRejection(error: unknown): error is CheckoutRejectionResponse {
  return typeof error === 'object' && error !== null && 'currentTotalMinor' in error
}

/** What changed, in the shopper's words (shown in the rejection alert). */
function issueText(issue: CheckoutRejectionResponse['issues'][number]): string {
  const name = issue.name ?? 'An item'
  return issue.kind === 'UNAVAILABLE'
    ? `${name} is no longer available.`
    : `${name} has only ${issue.availableStock} in stock (you wanted ${issue.requestedQuantity}).`
}

/** Step 2 of 4 · Review (Checkout / Mobile Checkout boards). */
function CheckoutPage() {
  const { user, isRestoring } = useSession()
  const basket = useBasket()
  const queryClient = useQueryClient()
  const startPayment = useStartPayment()
  const [rejection, setRejection] = useState<CheckoutRejectionResponse | null>(null)
  // Remount key for the alert, so a second rejection shakes again.
  const [rejections, setRejections] = useState(0)

  const mutation = useMutation({
    ...placeOrderMutation({ throwOnError: true }),
    onSuccess: (order) => {
      setRejection(null)
      void queryClient.invalidateQueries({ queryKey: getCartQueryKey() })
      // The order is placed either way; payment continues on the provider page
      // (or, if intent creation fails, from the order page).
      startPayment.start(order.id)
    },
    onError: async (error) => {
      if (isRejection(error)) {
        // Final re-validation found changes. Bring the basket in line with
        // the shelf — clamp to what's in stock, drop what's gone — and say so
        // in the alert, then let the shopper confirm again (ADR-0007: changes
        // are always shown, never silent). The server re-checks on the next try.
        setRejection(error)
        setRejections((n) => n + 1)
        for (const issue of error.issues) {
          const quantity = issue.kind === 'UNAVAILABLE' ? 0 : Math.max(0, issue.availableStock)
          const { data } = await setCartItem({ body: { productId: issue.productId, quantity } })
          if (data) queryClient.setQueryData<CartResponse>(getCartQueryKey(), data)
        }
        void queryClient.invalidateQueries({ queryKey: getCartQueryKey() })
      }
    },
  })

  if (isRestoring || (user && basket.isLoading)) {
    return (
      <main className="mx-auto w-full max-w-[1240px] px-5 pt-16 md:px-6">
        <div className="shimmer h-72 rounded-[28px] bg-skeleton" aria-busy="true" aria-label="Loading checkout" />
      </main>
    )
  }

  if (!user) return <SignInFirst />

  if (basket.lines.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-4 px-5 pb-24 pt-10 md:px-6 md:pt-16">
        <StepProgress current={1} label="Review" />
        <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[64px]">
          Nothing to <em className="font-normal italic md:text-brand">check out.</em>
        </h1>
        <Link to="/products" className="mt-2 inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-on-brand">
          Back to the shop
        </Link>
      </main>
    )
  }

  const total = formatPrice(basket.subtotalMinor, basket.currency)
  const blocked = basket.lines.some((l) => !l.available)
  const placing = mutation.isPending || startPayment.isPending
  const changed = new Set(rejection?.issues.map((i) => i.productId) ?? [])
  const place = () => mutation.mutate({ body: { expectedTotalMinor: basket.subtotalMinor } })
  const placeLabel = placing ? 'Placing order…' : `Place order · ${total}`

  return (
    <main className="relative mx-auto w-full max-w-[1240px] px-5 pb-10 pt-[18px] md:px-6 md:pb-[120px] md:pt-16">
      <div className="rise flex flex-col gap-3.5">
        <StepProgress current={1} label="Review" />
        <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[76px] md:leading-none">
          One last <em className="font-normal italic md:text-brand">look.</em>
        </h1>
      </div>

      <div className="mt-5 grid items-start gap-5 md:mt-11 md:grid-cols-[minmax(0,1fr)_380px] md:gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-4 md:gap-5">
          {rejection && (
            <div
              key={rejections}
              role="alert"
              className="shake flex items-start gap-4 rounded-[18px] border border-amber-line bg-amber-wash px-4 py-3.5 text-sm leading-normal md:rounded-[20px] md:px-[22px] md:py-5"
            >
              <span className="hidden h-9 w-9 flex-none place-items-center rounded-full bg-amber-accent text-on-amber md:grid" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 8v5M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <div className="flex flex-col gap-1.5">
                <strong className="text-heading">Your basket changed while you were checking out — please review and confirm again.</strong>
                {rejection.issues.map((issue) => (
                  <span key={issue.productId} className="text-ink-soft">
                    {issueText(issue)}
                  </span>
                ))}
                <span className="text-ink-soft">We updated it — your new total is {total}.</span>
              </div>
            </div>
          )}
          {!rejection && <AdjustmentsBanner shelf={shelfChanges(basket.lines)} />}

          <ReviewItems lines={basket.lines} changed={changed} forceOpen={rejection !== null} />

          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <InfoCard label="Account" title="Signed in" detail={user.email} icon="user" />
            <InfoCard label="Payment" title="Ethereal Pay" detail="Demo provider — no real money moves." icon="card" />
          </div>
        </div>

        <aside aria-label="Order total" className="hidden md:sticky md:top-28 md:block">
          <SummaryPanel eyebrow="Confirmed by the shop" itemCount={basket.itemCount} itemsTotal={total} total={total}>
            <PlaceOrderButton label={placeLabel} placing={placing} disabled={blocked} onPlace={place} />
            <Link to="/cart" className="relative text-center text-sm font-medium text-[#EEF4EF]/70 hover:text-[#EEF4EF]">
              Back to basket
            </Link>
            <span className="relative text-center text-xs text-[#EEF4EF]/50">Demo shop — payment is simulated on the next step.</span>
          </SummaryPanel>
        </aside>
      </div>

      {blocked && <p className="mt-4 text-sm text-danger">Remove unavailable items in your basket before checking out.</p>}

      {/* Phones: the place-order bar replaces the tab bar (none in the checkout flow). */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-1.5 border-t border-line bg-glass px-4 pb-[max(env(safe-area-inset-bottom),22px)] pt-3 backdrop-blur-[16px] backdrop-saturate-[1.4] md:hidden">
        <button
          type="button"
          onClick={place}
          disabled={placing || blocked}
          aria-busy={placing}
          className="flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-brand text-[15px] font-semibold text-on-brand shadow-glow transition active:scale-[0.97] disabled:opacity-70"
        >
          {placing && <span className="spinner" aria-hidden="true" />}
          {placeLabel}
        </button>
        <span className="text-center text-[11px] text-ink-soft">Demo shop — payment is simulated on the next step.</span>
      </div>
    </main>
  )
}

function PlaceOrderButton({ label, placing, disabled, onPlace }: { label: string; placing: boolean; disabled: boolean; onPlace: () => void }) {
  const magnet = useMagnetic(10)
  return (
    <button
      type="button"
      onClick={onPlace}
      disabled={placing || disabled}
      aria-busy={placing}
      {...magnet.bind}
      style={magnet.style}
      className={`relative flex h-[60px] items-center justify-center gap-2.5 rounded-full bg-[#7DD3A0] font-semibold text-[#0A130F] transition-[background-color,box-shadow] hover:bg-[#8fdcae] disabled:opacity-80 ${
        placing ? 'shadow-[0_0_0_1px_rgb(125_211_160/0.5),0_10px_40px_rgb(125_211_160/0.55)]' : 'shadow-[0_10px_30px_rgb(125_211_160/0.35)]'
      }`}
    >
      {placing && <span className="spinner" aria-hidden="true" />}
      {label}
    </button>
  )
}

const PLACEHOLDER: Record<string, string> = {
  OILS: 'bg-ph-oils',
  HERBS: 'bg-ph-herbs',
  CRYSTALS: 'bg-ph-crystals',
  TEAS: 'bg-ph-teas',
}

/** Review lines. Phones: collapsed to one row until tapped — and opened on a stock rejection. */
function ReviewItems({ lines, changed, forceOpen }: { lines: BasketLine[]; changed: Set<string>; forceOpen: boolean }) {
  const [open, setOpen] = useState(false)
  const expanded = open || forceOpen
  const count = lines.reduce((n, l) => n + l.quantity, 0)
  const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface-raised shadow-card md:rounded-[28px]">
      <div className="hidden items-center justify-between border-b border-line px-6 py-[18px] md:flex">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{countLabel}</span>
        <Link to="/cart" className="text-sm font-semibold text-brand hover:text-heading">
          Edit basket
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-heading md:hidden"
      >
        <span className="flex -space-x-3">
          {lines.slice(0, 3).map((line) => (
            <span key={line.productId} className={`h-12 w-10 overflow-hidden rounded-[10px] border-2 border-surface-raised ${PLACEHOLDER[artCategory(line.category)] ?? ''}`}>
              <ProductImage imageUrl={line.imageUrl} name="" category={artCategory(line.category)} seed={line.productId} className="h-full w-full" />
            </span>
          ))}
        </span>
        <span className="flex-1 text-sm font-semibold">{countLabel}</span>
        <svg className={`transition-transform ${expanded ? 'rotate-180' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <ul className={`${expanded ? 'block' : 'hidden'} border-t border-line md:block md:border-t-0`}>
        {lines.map((line) => {
          const category = artCategory(line.category)
          const isChanged = changed.has(line.productId)
          return (
            <li key={line.productId} className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0 md:gap-[18px] md:px-6 md:py-[18px]">
              <div className={`h-[72px] w-[58px] flex-none overflow-hidden rounded-[14px] md:h-[88px] md:w-[72px] md:rounded-2xl ${PLACEHOLDER[category] ?? 'bg-sand-100'}`}>
                <ProductImage imageUrl={line.imageUrl} name="" category={category} seed={line.productId} className="blur-up h-full w-full" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {line.category && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand md:text-[11px]">{categoryLabel(line.category)}</span>
                )}
                <span className="font-display text-base font-semibold leading-tight text-heading md:text-xl">{line.name}</span>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 font-mono text-[13px] ${isChanged ? 'bg-amber-wash text-amber-text ring-1 ring-amber-line' : 'bg-sand-100 text-ink-soft'}`}
              >
                × {line.quantity}
              </span>
              <span className="w-20 text-right font-display text-lg font-semibold text-heading md:w-24 md:text-xl">
                {formatPrice(line.totalMinor, line.currency)}
              </span>
            </li>
          )
        })}
        <li className="px-4 py-3 md:hidden">
          <Link to="/cart" className="text-sm font-semibold text-brand">
            Edit basket
          </Link>
        </li>
      </ul>
    </div>
  )
}

function InfoCard({ label, title, detail, icon }: { label: string; title: string; detail: string; icon: 'user' | 'card' }) {
  return (
    <div className="flex gap-3.5 rounded-[22px] border border-line bg-surface-raised p-[18px] md:p-5">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {icon === 'user' ? (
            <>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </>
          ) : (
            <>
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
            </>
          )}
        </svg>
      </span>
      <div className="flex min-w-0 flex-col gap-1 text-sm">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand">{label}</span>
        <span className="font-semibold text-heading">{title}</span>
        <span className="truncate text-ink-soft">{detail}</span>
      </div>
    </div>
  )
}

/** Signed out at step 2: sign in (or register) and come straight back — the basket merges on sign-in. */
function SignInFirst() {
  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-4 px-5 pb-24 pt-[18px] md:px-6 md:pt-16">
      <StepProgress current={1} label="Review" />
      <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[76px] md:leading-none">
        Sign in to <em className="font-normal italic md:text-brand">check out.</em>
      </h1>
      <p className="max-w-[460px] text-ink-soft md:text-lg">Your basket comes with you — we combine it with your account when you sign in.</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link
          to="/login"
          search={{ redirect: '/checkout' }}
          className="inline-flex h-[52px] items-center rounded-full bg-brand px-7 font-semibold text-on-brand shadow-glow transition hover:bg-brand-deep"
        >
          Sign in
        </Link>
        <Link to="/register" className="inline-flex h-[52px] items-center rounded-full border border-line-strong px-7 font-semibold text-heading transition hover:border-brand">
          Create an account
        </Link>
      </div>
    </main>
  )
}
