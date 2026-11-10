import type { ProductResponse } from '@ethereal-nature/api-client'
import { formatPrice } from '../../catalog/derive'
import { useAddToCart } from './AddToCartButton'

/**
 * Quick add on product cards: a full-width glass pill "Quick add · €x" on
 * desktop, a round glass "+" on phones (Catalog / Mobile Catalog boards).
 * Adds one and opens the basket.
 */
export function QuickAddButton({ product, variant = 'overlay' }: { product: ProductResponse; variant?: 'overlay' | 'beside' }) {
  const { add, isPending } = useAddToCart(product)
  if (variant === 'beside') {
    // Mobile Home board: a soft round "+" next to the name.
    return (
      <button
        type="button"
        onClick={() => add(1)}
        disabled={isPending}
        aria-label={`Add ${product.name} to basket`}
        className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand transition active:scale-95 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => add(1)}
      disabled={isPending}
      aria-label={`Add ${product.name} to basket`}
      className="ml-auto flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-line bg-glass text-sm font-semibold text-heading backdrop-blur-[14px] transition active:scale-[0.97] disabled:opacity-60 md:h-12 md:w-full"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className="hidden md:inline">Quick add · {formatPrice(product.priceMinor, product.currency)}</span>
    </button>
  )
}
