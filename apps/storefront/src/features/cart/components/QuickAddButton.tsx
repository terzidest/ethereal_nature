import type { ProductResponse } from '@ethereal-nature/api-client'
import { useAddToCart } from './AddToCartButton'

/** The round "+" on product cards: adds one and opens the basket. */
export function QuickAddButton({ product }: { product: ProductResponse }) {
  const { add, isPending } = useAddToCart(product)
  return (
    <button
      type="button"
      onClick={() => add(1)}
      disabled={isPending}
      aria-label={`Add ${product.name} to basket`}
      className="grid h-11 w-11 place-items-center rounded-full bg-brand text-on-brand shadow-glow transition hover:bg-brand-deep active:scale-95 disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  )
}
