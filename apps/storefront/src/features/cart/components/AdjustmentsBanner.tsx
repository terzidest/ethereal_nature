import { formatPrice } from '../../catalog/derive'
import { hasAdjustments, useMergeAdjustments } from '../adjustments-store'

const dropReasonText: Record<string, string> = {
  OUT_OF_STOCK: 'is out of stock',
  ARCHIVED: 'is no longer sold',
  NOT_FOUND: 'is no longer sold',
}

/**
 * "We updated your basket to match the shelf." (Cart board) — never silently
 * mutate the basket (ADR-0007). Explains the last merge's adjustments plus
 * whatever the live cart shows (`shelf`, derived from stock on each line).
 */
export function AdjustmentsBanner({ shelf = [] }: { shelf?: string[] }) {
  const { adjustments, productNames, dismiss } = useMergeAdjustments()
  const nameOf = (productId: string) => productNames[productId] ?? 'An item'
  const merged = hasAdjustments(adjustments)
    ? [
        ...adjustments.dropped.map(
          (d) => `${nameOf(d.productId)} was removed — it ${dropReasonText[d.reason] ?? 'is unavailable'}.`,
        ),
        ...adjustments.clamped.map(
          (c) => `${nameOf(c.productId)}: quantity reduced from ${c.requestedQuantity} to ${c.grantedQuantity} (limited stock).`,
        ),
        ...adjustments.priceChanged.map(
          (p) =>
            `${nameOf(p.productId)}: price changed from ${formatPrice(p.snapshotPriceMinor, 'EUR')} to ${formatPrice(p.currentPriceMinor, 'EUR')} since you added it.`,
        ),
      ]
    : []
  const messages = [...merged, ...shelf]
  if (messages.length === 0) return null

  return (
    <div role="status" className="flex items-start gap-4 rounded-[18px] border border-amber-line bg-amber-wash px-4 py-3.5 md:rounded-[20px] md:px-5 md:py-[18px]">
      <span className="hidden h-9 w-9 flex-none place-items-center rounded-full bg-amber-accent text-on-amber md:grid" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 8v5M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <div className="flex flex-col gap-1 text-sm leading-normal">
        <strong className="text-heading">We updated your basket to match the shelf.</strong>
        {messages.map((message) => (
          <span key={message} className="text-ink-soft">
            {message}
          </span>
        ))}
        <span className="text-ink-soft">Prices are always confirmed by the shop.</span>
      </div>
      {merged.length > 0 && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-auto grid h-9 w-9 flex-none place-items-center rounded-full text-ink-soft transition hover:text-heading"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  )
}
