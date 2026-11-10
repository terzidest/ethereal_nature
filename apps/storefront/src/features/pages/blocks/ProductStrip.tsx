import { listProductsOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { z } from 'zod'
import { QuickAddButton } from '../../cart/components/QuickAddButton'
import { ProductCard } from '../../catalog/components/ProductCard'
import { CATEGORIES, SORTS } from '../../catalog/search'
import { SectionHeading } from '../emphasis'

export const productStripSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic. */
  title: z.string(),
  category: z.enum(CATEGORIES).optional(),
  sort: z.enum(SORTS).default('newest'),
  limit: z.number().int().min(1).max(12).default(4),
})

export type ProductStripProps = z.output<typeof productStripSchema>

/**
 * Pure query builder, shared by the block and the route loader so the SSR
 * prefetch and the client render hit the exact same query key. Must be called
 * lazily (after configureApiClient) — hey-api captures the baseUrl at creation.
 */
export function productStripQuery(props: ProductStripProps) {
  return listProductsOptions({
    query: { page: 1, pageSize: props.limit, sort: props.sort, category: props.category },
  })
}

/** A scroll-snap row: 4 cards across on desktop with prev/next, a swipe row (next card peeks) on mobile. */
export function ProductStrip(props: ProductStripProps) {
  const { data } = useQuery(productStripQuery(props))
  const row = useRef<HTMLUListElement>(null)
  const pageBy = (direction: 1 | -1) =>
    row.current?.scrollBy({ left: direction * row.current.clientWidth, behavior: 'smooth' })
  const scrollable = (data?.items.length ?? 0) > 4

  return (
    <section className="mx-auto w-full max-w-[1240px] py-12 md:py-20">
      <div className="flex items-end justify-between gap-6 px-5 md:px-6">
        <SectionHeading eyebrow={props.eyebrow} heading={props.title} />
        {/* Phones swipe; desktop pages with arrows (Home boards). */}
        <span className="whitespace-nowrap pb-1.5 text-xs text-ink-soft md:hidden" aria-hidden="true">
          Swipe →
        </span>
        <span className="hidden shrink-0 gap-2 pb-2 md:flex">
          <ArrowButton direction={-1} disabled={!scrollable} onClick={() => pageBy(-1)} />
          <ArrowButton direction={1} disabled={!scrollable} onClick={() => pageBy(1)} />
        </span>
      </div>

      <ul
        ref={row}
        className="mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:mt-12 md:scroll-px-6 md:gap-5 md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {data?.items.map((product, i) => (
          <li
            key={product.id}
            className="rise w-[232px] shrink-0 snap-start md:w-[calc((100%-3*1.25rem)/4)]"
            style={{ animationDelay: `${Math.min(i, 4) * 80}ms` }}
          >
            <ProductCard
              product={product}
              quickAdd={<QuickAddButton product={product} />}
              quickAddBeside={<QuickAddButton product={product} variant="beside" />}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ArrowButton({ direction, disabled, onClick }: { direction: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 1 ? 'Next products' : 'Previous products'}
      className={`grid h-12 w-12 place-items-center rounded-full transition disabled:opacity-40 ${
        direction === 1
          ? 'bg-brand text-on-brand hover:bg-brand-deep'
          : 'border border-line-strong text-heading hover:border-brand hover:text-brand'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === 1 ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'} />
      </svg>
    </button>
  )
}
