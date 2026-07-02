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
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">Shop</h1>
        <p className="text-ink/70">Essential oils, herbs, crystals, and teas.</p>
      </header>

      <CatalogControls search={search} />

      {data && data.items.length === 0 && (
        <p className="py-16 text-center text-ink/60">Nothing matches — try a different search or category.</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((product) => <ProductCard key={product.id} product={product} />)}
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
