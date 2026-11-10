import { isLowStock } from '../derive'

/** The meter fills against this many pieces; past it the bar is full. */
const FULL_AT = 40

/** Stock meter (Product board): "Low stock · N pieces left" in amber at ≤ 10, otherwise "In stock". */
export function StockMeter({ stock }: { stock: number }) {
  if (stock === 0) return null
  const low = isLowStock(stock)
  const width = `${Math.max(6, Math.round((Math.min(stock, FULL_AT) / FULL_AT) * 100))}%`
  return (
    <div className="flex flex-col gap-2 rounded-[18px] border border-line bg-surface-raised px-4 py-3.5 md:gap-2.5 md:rounded-[20px] md:px-5 md:py-[18px]">
      <div className="flex items-center justify-between text-[13px] md:text-sm">
        <span className="font-semibold text-heading">{low ? 'Low stock' : 'In stock'}</span>
        <span className="text-ink-soft md:font-mono md:text-xs">
          {stock} {stock === 1 ? 'piece' : 'pieces'} left
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-soft" role="presentation">
        <div className={`h-full rounded-full ${low ? 'bg-amber-accent' : 'bg-brand'}`} style={{ width }} />
      </div>
    </div>
  )
}
