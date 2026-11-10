import type { ProductResponse } from '@ethereal-nature/api-client'
import { useMagnetic } from '@ethereal-nature/ui'
import { useEffect, useState } from 'react'
import { formatPrice } from '../../catalog/derive'
import { useAddToCart } from './AddToCartButton'

/**
 * Stepper + "Add to basket · €x" for the product page (Product / Mobile
 * Product boards). `panel` is the desktop buy panel (magnetic button);
 * `bar` is the phone's sticky buy bar. The button turns into "Added to
 * basket" instead of opening the drawer; the header/tab-bar count updates.
 * Quantity is owned by the page so both variants stay in step.
 */
export function AddToBasket({
  product,
  quantity,
  onQuantity,
  variant,
}: {
  product: ProductResponse
  quantity: number
  onQuantity: (quantity: number) => void
  variant: 'panel' | 'bar'
}) {
  const [added, setAdded] = useState(false)
  const { add, isPending } = useAddToCart(product, { openDrawer: false, onAdded: () => setAdded(true) })
  const magnet = useMagnetic(10)
  const max = product.stock

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 2500)
    return () => clearTimeout(timer)
  }, [added])

  const change = (next: number) => {
    setAdded(false)
    onQuantity(Math.min(max, Math.max(1, next)))
  }

  if (product.stock === 0) {
    return (
      <button
        type="button"
        disabled
        className={`w-full rounded-full bg-sand-100 font-semibold text-ink-soft ${variant === 'panel' ? 'h-[60px]' : 'h-[52px]'}`}
      >
        Out of stock
      </button>
    )
  }

  const panel = variant === 'panel'
  const label = added ? 'Added to basket' : `Add to basket · ${formatPrice(product.priceMinor * quantity, product.currency)}`
  const stepButton = `grid place-items-center rounded-full text-heading transition hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent ${
    panel ? 'h-[58px] w-[52px] text-xl' : 'h-10 w-10 text-lg'
  }`

  return (
    <div className={`flex ${panel ? 'gap-3' : 'items-center gap-2.5'}`}>
      <div
        className={`flex shrink-0 items-center rounded-full border border-line-strong ${panel ? 'h-[60px] bg-surface-raised' : 'gap-0.5 p-0.5'}`}
      >
        <button type="button" onClick={() => change(quantity - 1)} disabled={quantity <= 1} aria-label={`One fewer ${product.name}`} className={stepButton}>
          −
        </button>
        <span aria-live="polite" className={`text-center font-mono ${panel ? 'min-w-7 text-[15px]' : 'min-w-6 text-sm'}`}>
          {quantity}
        </span>
        <button type="button" onClick={() => change(quantity + 1)} disabled={quantity >= max} aria-label={`One more ${product.name}`} className={stepButton}>
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => add(quantity)}
        disabled={isPending}
        {...(panel ? magnet.bind : {})}
        style={panel ? magnet.style : undefined}
        className={`flex flex-1 items-center justify-center gap-2 rounded-full font-semibold text-on-brand shadow-glow transition-[background-color,transform] active:scale-[0.98] disabled:opacity-70 ${
          added ? 'bg-brand-deep' : 'bg-brand hover:bg-brand-deep'
        } ${panel ? 'h-[60px] text-base' : 'h-[52px] text-[15px]'}`}
      >
        {added && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        )}
        {isPending ? 'Adding…' : label}
      </button>
    </div>
  )
}
