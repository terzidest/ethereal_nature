import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ProductsTable } from '../features/products/components/ProductsTable'
import { categoryLabel } from '../features/products/derive'
import { productsTableQuery } from '../features/products/queries'
import {
  CATEGORIES,
  PAGE_SIZES,
  pageOf,
  pageSizeOf,
  sortOf,
  validateProductsTableSearch,
} from '../features/products/search'

export const Route = createFileRoute('/products')({
  validateSearch: validateProductsTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(productsTableQuery(deps)),
  component: ProductsPage,
})

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/products' })
  const { data, isFetching } = useQuery(productsTableQuery(search))

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Products</h1>
        <span className="text-sm text-ink/50">
          {data ? `${data.totalItems} products` : ''} {isFetching ? '· refreshing…' : ''}
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={search.category ?? ''}
          onChange={(event) => {
            const value = event.target.value
            void navigate({
              search: (prev) => ({
                ...prev,
                category: CATEGORIES.find((c) => c === value),
                page: undefined,
              }),
            })
          }}
          className="rounded border border-brand-100 bg-white px-3 py-1.5 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            const q = new FormData(event.currentTarget).get('q')?.toString().trim()
            void navigate({ search: (prev) => ({ ...prev, q: q === '' ? undefined : q, page: undefined }) })
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={search.q ?? ''}
            placeholder="Search by name…"
            className="w-56 rounded border border-brand-100 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </form>

        <select
          value={pageSizeOf(search)}
          onChange={(event) => {
            const pageSize = Number(event.target.value)
            void navigate({
              search: (prev) => ({
                ...prev,
                pageSize: pageSize === 25 ? undefined : pageSize,
                page: undefined,
              }),
            })
          }}
          className="ml-auto rounded border border-brand-100 bg-white px-3 py-1.5 text-sm"
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-brand-100 bg-white">
        {data && (
          <ProductsTable
            products={data.items}
            sort={sortOf(search)}
            onSortChange={(sort) => {
              void navigate({
                search: (prev) => ({ ...prev, sort: sort === 'newest' ? undefined : sort, page: undefined }),
              })
            }}
          />
        )}
      </div>

      {data && data.totalPages > 1 && (
        <nav className="flex items-center justify-end gap-4 text-sm" aria-label="Pagination">
          <PageButton search={search} page={pageOf(search) - 1} disabled={pageOf(search) <= 1} label="← Prev" />
          <span className="text-ink/60">
            Page {data.page} / {data.totalPages}
          </span>
          <PageButton
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

function PageButton({
  search,
  page,
  disabled,
  label,
}: {
  search: ReturnType<typeof Route.useSearch>
  page: number
  disabled: boolean
  label: string
}) {
  if (disabled) return <span className="text-ink/30">{label}</span>
  return (
    <Link
      to="/products"
      search={{ ...search, page: page === 1 ? undefined : page }}
      className="font-medium text-brand-700 hover:text-brand-900"
    >
      {label}
    </Link>
  )
}
