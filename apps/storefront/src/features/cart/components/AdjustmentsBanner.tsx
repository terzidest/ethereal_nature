import { formatPrice } from '../../catalog/derive'
import { hasAdjustments, useMergeAdjustments } from '../adjustments-store'

const dropReasonText: Record<string, string> = {
  OUT_OF_STOCK: 'is out of stock',
  ARCHIVED: 'is no longer sold',
  NOT_FOUND: 'is no longer sold',
}

/** "2 items were updated" — never silently mutate the basket (ADR-0007). */
export function AdjustmentsBanner() {
  const { adjustments, productNames, dismiss } = useMergeAdjustments()
  if (!hasAdjustments(adjustments)) return null

  const nameOf = (productId: string) => productNames[productId] ?? 'An item'
  const messages = [
    ...adjustments.dropped.map(
      (d) => `${nameOf(d.productId)} was removed — it ${dropReasonText[d.reason] ?? 'is unavailable'}.`,
    ),
    ...adjustments.clamped.map(
      (c) =>
        `${nameOf(c.productId)}: quantity reduced from ${c.requestedQuantity} to ${c.grantedQuantity} (limited stock).`,
    ),
    ...adjustments.priceChanged.map(
      (p) =>
        `${nameOf(p.productId)}: price changed from ${formatPrice(p.snapshotPriceMinor, 'EUR')} to ${formatPrice(p.currentPriceMinor, 'EUR')} since you added it.`,
    ),
  ]

  return (
    <aside className="flex flex-col gap-2 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-baseline justify-between gap-4">
        <strong>
          {messages.length === 1 ? 'One item was updated' : `${messages.length} items were updated`} when your
          carts were combined
        </strong>
        <button type="button" onClick={dismiss} className="font-medium underline hover:no-underline">
          Dismiss
        </button>
      </div>
      <ul className="list-disc pl-5">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </aside>
  )
}
