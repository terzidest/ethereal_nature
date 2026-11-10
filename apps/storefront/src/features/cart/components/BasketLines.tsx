import { ProductImage } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import { categoryLabel, formatPrice } from '../../catalog/derive'
import { artCategory } from '../art'
import type { BasketLine } from '../useBasket'

const PLACEHOLDER: Record<string, string> = {
  OILS: 'bg-ph-oils',
  HERBS: 'bg-ph-herbs',
  CRYSTALS: 'bg-ph-crystals',
  TEAS: 'bg-ph-teas',
}

/** Basket lines (Cart board): a table with Item / Quantity / Total on desktop, stacked cards on phones. */
export function BasketLines({
  lines,
  disabled,
  onQuantity,
  onRemove,
}: {
  lines: BasketLine[]
  disabled: boolean
  onQuantity: (line: BasketLine, quantity: number) => void
  onRemove: (line: BasketLine) => void
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface-raised shadow-card md:rounded-[28px]">
      <div className="hidden grid-cols-[minmax(0,1fr)_150px_110px_44px] gap-5 border-b border-line px-6 py-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft md:grid">
        <span>Item</span>
        <span>Quantity</span>
        <span className="text-right">Total</span>
        <span />
      </div>
      <ul>
        {lines.map((line) => {
          const capped = line.stock !== undefined && line.quantity >= line.stock
          const category = artCategory(line.category)
          return (
            <li
              key={line.productId}
              className="grid grid-cols-1 items-center gap-y-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_150px_110px_44px] md:gap-5 md:px-6 md:py-5"
            >
              <div className="flex min-w-0 items-center gap-3.5 md:gap-[18px]">
                <Link
                  to="/products/$productId"
                  params={{ productId: line.productId }}
                  aria-label={line.name}
                  className={`block h-[88px] w-[72px] flex-none overflow-hidden rounded-2xl md:h-[120px] md:w-24 md:rounded-[18px] ${PLACEHOLDER[category] ?? 'bg-sand-100'}`}
                >
                  <ProductImage imageUrl={line.imageUrl} name="" category={category} seed={line.productId} className="h-full w-full" />
                </Link>
                <div className="flex min-w-0 flex-col gap-1.5">
                  {line.category && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand md:text-[11px]">
                      {categoryLabel(line.category)}
                    </span>
                  )}
                  <Link
                    to="/products/$productId"
                    params={{ productId: line.productId }}
                    className="font-display text-lg font-semibold leading-[1.2] text-heading [overflow-wrap:anywhere] hover:text-brand md:text-[21px]"
                  >
                    {line.name}
                  </Link>
                  <span className="text-[13px] text-ink-soft md:text-sm">{formatPrice(line.unitMinor, line.currency)} each</span>
                  {!line.available ? (
                    <span className="self-start rounded-full bg-danger-wash px-2.5 py-1 text-xs font-semibold text-danger">No longer available</span>
                  ) : (
                    capped && (
                      <span className="self-start rounded-full bg-amber-wash px-2.5 py-1 text-xs font-semibold text-amber-text">
                        Max {line.stock} available
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 md:contents">
                <div className="inline-flex h-11 items-center rounded-full border border-line-strong">
                  <button
                    type="button"
                    onClick={() => onQuantity(line, line.quantity - 1)}
                    disabled={disabled || line.quantity <= 1}
                    aria-label={`Decrease quantity of ${line.name}`}
                    className="grid h-[42px] w-11 place-items-center text-lg text-heading disabled:opacity-40"
                  >
                    −
                  </button>
                  <span aria-live="polite" className="min-w-7 text-center font-mono text-sm">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuantity(line, line.quantity + 1)}
                    disabled={disabled || capped || !line.available}
                    aria-label={`Increase quantity of ${line.name}`}
                    className="grid h-[42px] w-11 place-items-center text-lg text-heading disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line)}
                  disabled={disabled}
                  aria-label={`Remove ${line.name}`}
                  className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-danger-wash hover:text-danger md:order-last"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
                <span className="ml-auto text-right font-display text-xl font-semibold text-heading md:ml-0 md:text-[22px]">
                  {formatPrice(line.totalMinor, line.currency)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
