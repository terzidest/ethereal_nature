import { listProductsOptions, type ProductResponse } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CATALOG_COPY } from '../copy'
import { ProductCard } from './ProductCard'

/** Derived, not curated (plan §2.4): two from the same shelf, two from others. */
export function pairsFor(product: ProductResponse, sameShelf: ProductResponse[], elsewhere: ProductResponse[]) {
  const same = sameShelf.filter((p) => p.id !== product.id).slice(0, 2)
  const other = elsewhere.filter((p) => p.category !== product.category && p.id !== product.id).slice(0, 4 - same.length)
  return [...same, ...other]
}

export function PairsWellWith({ product }: { product: ProductResponse }) {
  const sameShelf = useQuery(listProductsOptions({ query: { page: 1, pageSize: 3, category: product.category } }))
  const elsewhere = useQuery(listProductsOptions({ query: { page: 1, pageSize: 12 } }))
  const pairs = pairsFor(product, sameShelf.data?.items ?? [], elsewhere.data?.items ?? [])
  if (pairs.length === 0) return null
  const shelf = CATALOG_COPY[product.category].em.replace('.', '')

  return (
    <section className="mx-auto w-full max-w-[1240px] pb-10 pt-12 md:px-6 md:pb-[120px] md:pt-28">
      <div className="flex items-end justify-between gap-4 px-5 md:gap-6 md:px-0">
        <div className="flex flex-col gap-2.5 md:gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">From the same shelf</span>
          <h2 className="font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-heading md:text-5xl">Pairs well with</h2>
        </div>
        <Link
          to="/products"
          search={{ category: product.category }}
          className="whitespace-nowrap pb-1.5 text-[13px] font-semibold text-brand transition hover:text-heading md:text-sm"
        >
          All {shelf} →
        </Link>
      </div>
      <ul className="mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 [scrollbar-width:none] md:mt-10 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {pairs.map((p) => (
          <li key={p.id} className="w-[188px] shrink-0 snap-start md:w-auto">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}
