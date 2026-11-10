import { Link, useNavigate } from '@tanstack/react-router'
import { CATEGORIES, SORTS, sortOf, type CatalogSearch } from '../search'
import { categoryLabel, formatPrice } from '../derive'

const sortLabels: Record<(typeof SORTS)[number], string> = {
  newest: 'Newest',
  name: 'Name A–Z',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
}

export function CatalogControls({ search }: { search: CatalogSearch }) {
  const navigate = useNavigate({ from: '/products/' })

  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav className="flex flex-wrap gap-2" aria-label="Categories">
        <CategoryTab active={search.category === undefined} category={undefined} search={search} label="All" />
        {CATEGORIES.map((category) => (
          <CategoryTab
            key={category}
            active={search.category === category}
            category={category}
            search={search}
            label={categoryLabel(category)}
          />
        ))}
      </nav>

      {search.maxPrice !== undefined && (
        <Link
          to="/products"
          search={{ ...search, maxPrice: undefined, page: undefined }}
          className="rounded-full bg-amber-wash px-4 py-1.5 text-sm font-medium text-amber-text ring-1 ring-amber-line transition hover:bg-amber-wash/70"
          aria-label={`Remove price filter: under ${formatPrice(search.maxPrice, 'EUR')}`}
        >
          Under {formatPrice(search.maxPrice, 'EUR')} <span aria-hidden="true">×</span>
        </Link>
      )}

      <form
        className="ml-auto flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const q = new FormData(event.currentTarget).get('q')?.toString().trim()
          void navigate({
            search: (prev) => ({ ...prev, q: q === '' ? undefined : q, page: undefined }),
          })
        }}
      >
        <input
          type="search"
          name="q"
          defaultValue={search.q ?? ''}
          placeholder="Search products…"
          className="w-44 rounded-full border border-line bg-surface-raised px-4 py-1.5 text-sm outline-none focus:border-brand"
        />
        <select
          value={sortOf(search)}
          onChange={(event) => {
            const sort = event.target.value as (typeof SORTS)[number]
            void navigate({
              search: (prev) => ({ ...prev, sort: sort === 'newest' ? undefined : sort, page: undefined }),
            })
          }}
          className="rounded-full border border-line bg-surface-raised px-3 py-1.5 text-sm"
          aria-label="Sort"
        >
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {sortLabels[sort]}
            </option>
          ))}
        </select>
      </form>
    </div>
  )
}

function CategoryTab({
  active,
  category,
  search,
  label,
}: {
  active: boolean
  category: CatalogSearch['category']
  search: CatalogSearch
  label: string
}) {
  return (
    <Link
      to="/products"
      search={{ ...search, category, page: undefined }}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand text-on-brand' : 'bg-brand-soft text-heading hover:bg-brand-soft-strong'
      }`}
    >
      {label}
    </Link>
  )
}
