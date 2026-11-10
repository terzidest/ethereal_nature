import { listProductsOptions, type ProductResponse } from '@ethereal-nature/api-client'
import { ProductImage } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '../../catalog/derive'
import { useAddToCart } from './AddToCartButton'

/** "A little something under €10" — small add-ons from the price filter (plan §3.1), one tap each. */
export function AddOns({ inBasket }: { inBasket: Set<string> }) {
  const { data } = useQuery(listProductsOptions({ query: { page: 1, pageSize: 8, maxPriceMinor: 1000 } }))
  const picks = (data?.items ?? []).filter((p) => p.stock > 0).slice(0, 3)
  if (picks.length === 0) return null

  return (
    <section className="mt-2 flex flex-col gap-4 md:mt-6 md:gap-[18px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[22px] font-semibold text-heading md:text-[26px]">
          A little something <em className="font-normal italic">under €10</em>
        </h2>
        <span className="whitespace-nowrap text-xs text-ink-soft md:font-mono md:text-[11px] md:uppercase md:tracking-[0.12em]">One-tap add</span>
      </div>
      <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {picks.map((product) => (
          <li key={product.id} className="w-[260px] shrink-0 snap-start md:w-auto">
            <AddOn product={product} inBasket={inBasket.has(product.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function AddOn({ product, inBasket }: { product: ProductResponse; inBasket: boolean }) {
  const { add, isPending } = useAddToCart(product, { openDrawer: false })
  return (
    <div className="flex items-center gap-3.5 rounded-[20px] border border-line bg-surface-raised p-3 transition duration-[450ms] ease-[var(--ease-grow)] hover:-translate-y-1">
      <div className="h-[76px] w-16 flex-none overflow-hidden rounded-[14px] bg-sand-100">
        <ProductImage imageUrl={product.imageUrl} name="" category={product.category} seed={product.slug} className="blur-up h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium leading-[1.3] text-heading">{product.name}</span>
        <span className="font-display text-[17px] font-semibold text-heading">{formatPrice(product.priceMinor, product.currency)}</span>
      </div>
      <button
        type="button"
        onClick={() => add(1)}
        disabled={isPending}
        aria-label={inBasket ? `Add another ${product.name}` : `Add ${product.name}`}
        className={`grid h-11 w-11 flex-none place-items-center rounded-full transition active:scale-95 ${
          inBasket ? 'bg-brand-soft text-brand' : 'bg-brand text-on-brand hover:bg-brand-deep'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={inBasket ? 'M20 6L9 17l-5-5' : 'M12 5v14M5 12h14'} />
        </svg>
      </button>
    </div>
  )
}
