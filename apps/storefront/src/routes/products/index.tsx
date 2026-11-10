import { Art } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { QuickAddButton } from '../../features/cart/components/QuickAddButton'
import { CatalogControls } from '../../features/catalog/components/CatalogControls'
import { ProductCard } from '../../features/catalog/components/ProductCard'
import { CATALOG_COPY } from '../../features/catalog/copy'
import { catalogListQuery, categoryCountsQuery } from '../../features/catalog/queries'
import { pageOf, validateCatalogSearch, type CatalogSearch } from '../../features/catalog/search'

export const Route = createFileRoute('/products/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  // SSR waits for the data so first paint ships real product HTML. In the
  // browser the loader only starts the fetch: a filter change shows paper
  // skeletons right away instead of holding the old grid (Catalog board).
  loader: ({ context, deps }) => {
    const ready = Promise.all([
      context.queryClient.ensureQueryData(catalogListQuery(deps)),
      context.queryClient.ensureQueryData(categoryCountsQuery()),
    ])
    return typeof window === 'undefined' ? ready.then(() => undefined) : undefined
  },
  head: () => ({
    meta: [
      { title: 'Shop | Ethereal Nature' },
      { name: 'description', content: 'Essential oils, herbs, crystals, and teas — small-batch and ethically sourced.' },
    ],
  }),
  component: CatalogPage,
})

function CatalogPage() {
  const search = Route.useSearch()
  const { data } = useQuery(catalogListQuery(search))
  const copy = CATALOG_COPY[search.category ?? 'ALL']
  const filtered = Boolean(search.q || search.category || search.maxPrice)

  return (
    <main className="relative mx-auto w-full max-w-[1240px] overflow-x-clip px-5 pb-12 pt-6 md:px-6 md:pb-[120px] md:pt-[72px]">
      <span
        className="aurora -top-20 right-[-140px] h-[300px] w-[300px] bg-[light-dark(rgb(122_196_148/0.40),rgb(60_160_105/0.30))] md:-top-[220px] md:left-1/2 md:right-auto md:-ml-[350px] md:h-[420px] md:w-[700px]"
        aria-hidden="true"
      />

      <header className="relative flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-8">
        <div className="rise flex flex-col gap-3 md:gap-3.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">
            The shop · {data ? `${data.totalItems} ${data.totalItems === 1 ? 'product' : 'products'}` : '…'}
          </span>
          <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[76px] md:leading-none">
            {copy.title} <em className="font-normal italic md:text-brand">{copy.em}</em>
          </h1>
        </div>
        <p className="text-[15px] leading-relaxed text-ink-soft md:max-w-[360px] md:text-base">{copy.blurb}</p>
      </header>

      <CatalogControls search={search} />

      {!data ? (
        <ul aria-busy="true" aria-label="Loading products" className="grid grid-cols-2 gap-x-3 gap-y-5 md:mt-9 md:gap-x-5 md:gap-y-11 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      ) : data.items.length === 0 ? (
        <EmptyCatalog filtered={filtered} />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:mt-9 md:gap-x-5 md:gap-y-11 lg:grid-cols-4">
          {data.items.map((product, i) => (
            <li key={product.id} className="rise" style={{ animationDelay: `${Math.min(i, 7) * 60}ms` }}>
              <ProductCard product={product} quickAdd={<QuickAddButton product={product} />} />
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
          <PageLink search={search} page={pageOf(search) - 1} disabled={pageOf(search) <= 1} label="Previous" />
          <span className="px-2 font-mono text-xs text-ink-soft">
            {data.page} / {data.totalPages}
          </span>
          <PageLink search={search} page={pageOf(search) + 1} disabled={pageOf(search) >= data.totalPages} label="Next" />
        </nav>
      )}
    </main>
  )
}

/** Paper skeleton: the card's shape with a shimmer, so nothing jumps when photos arrive. */
function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 md:gap-4" aria-hidden="true">
      <div className="shimmer aspect-[4/5] rounded-[18px] bg-skeleton md:rounded-[24px]" />
      <div className="flex flex-col gap-2 px-1">
        <span className="shimmer h-2.5 w-[38%] rounded-md bg-skeleton" />
        <span className="shimmer h-3.5 w-[76%] rounded-md bg-skeleton" />
      </div>
    </div>
  )
}

function EmptyCatalog({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-2 flex flex-col items-center gap-3 rounded-[28px] px-6 pb-16 pt-6 text-center md:mt-10 md:border md:border-dashed md:border-line-strong md:pt-12">
      <Art name="plate-ginkgo" className="w-[120px] md:w-[150px]" />
      <p className="font-display text-2xl font-semibold text-heading md:text-[28px] md:font-normal">Nothing growing here yet.</p>
      <p className="text-sm text-ink-soft md:text-base">Try another word or clear the filters.</p>
      {filtered && (
        <Link
          to="/products"
          className="mt-2 inline-flex h-12 items-center rounded-full border border-line-strong px-6 font-semibold text-heading transition hover:border-brand md:h-11 md:border-0 md:bg-brand md:text-on-brand md:hover:bg-brand-deep"
        >
          Clear filters
        </Link>
      )}
    </div>
  )
}

function PageLink({
  search,
  page,
  disabled,
  label,
}: {
  search: CatalogSearch
  page: number
  disabled: boolean
  label: string
}) {
  const className = 'inline-flex h-11 items-center rounded-full border px-5 text-sm font-semibold transition'
  if (disabled) {
    return <span className={`${className} border-line text-ink-soft/50`}>{label}</span>
  }
  return (
    <Link
      to="/products"
      search={{ ...search, page: page === 1 ? undefined : page }}
      className={`${className} border-line-strong text-heading hover:border-brand hover:text-brand`}
    >
      {label}
    </Link>
  )
}
