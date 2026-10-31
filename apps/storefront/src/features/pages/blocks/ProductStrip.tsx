import { listProductsOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { CATEGORIES, SORTS } from '../../catalog/search'
import { ProductCard } from '../../catalog/components/ProductCard'

export const productStripSchema = z.object({
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

export function ProductStrip(props: ProductStripProps) {
  const { data } = useQuery(productStripQuery(props))

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-14">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold text-brand-900">{props.title}</h2>
        <Link
          to="/products"
          search={props.category ? { category: props.category } : {}}
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          View all →
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data?.items.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}
