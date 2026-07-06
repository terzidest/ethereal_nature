import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CatalogControls } from '../../features/catalog/components/CatalogControls'
import { ProductCard } from '../../features/catalog/components/ProductCard'
import { catalogListQuery } from '../../features/catalog/queries'
import { pageOf, validateCatalogSearch, type CatalogSearch } from '../../features/catalog/search'

export const Route = createFileRoute('/products/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(catalogListQuery(deps)),
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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900">Shop</h1>
        <p className="text-ink/70">Essential oils, herbs, crystals, and teas.</p>
      </header>

      <CatalogControls search={search} />

      {data && data.items.length > 0 && (
        <p className="text-sm text-ink/50">
          {data.totalItems} {data.totalItems === 1 ? 'product' : 'products'}
          {search.q ? ` for “${search.q}”` : ''}
        </p>
      )}

      {data && data.items.length === 0 && (
        <p className="py-16 text-center text-ink/60">Nothing matches — try a different search or category.</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data
          ? data.items.map((product) => <ProductCard key={product.id} product={product} />)
          : Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
      </section>

      {data && data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4" aria-label="Pagination">
          <PageLink search={search} page={pageOf(search) - 1} disabled={pageOf(search) <= 1} label="← Previous" />
          <span className="text-sm text-ink/60">
            Page {data.page} of {data.totalPages}
          </span>
          <PageLink
            search={search}
            page={pageOf(search) + 1}
            disabled={pageOf(search) >= data.totalPages}
            label="Next →"
          />
        </nav>
      )}
    </main>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-tile bg-surface-raised shadow-card" aria-hidden>
      <div className="aspect-square bg-brand-50" />
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <div className="h-3 w-16 rounded bg-brand-100" />
        <div className="h-5 w-3/4 rounded bg-brand-100" />
        <div className="h-6 w-20 rounded bg-brand-50" />
      </div>
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
  if (disabled) return <span className="text-sm text-ink/30">{label}</span>
  return (
    <Link
      to="/products"
      search={{ ...search, page: page === 1 ? undefined : page }}
      className="text-sm font-medium text-brand-700 hover:text-brand-900"
    >
      {label}
    </Link>
  )
}
