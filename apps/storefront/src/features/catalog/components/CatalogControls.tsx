import { CategoryGlyph } from '@ethereal-nature/ui'
import type { ProductSortDto } from '@ethereal-nature/api-client'
import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CATALOG_COPY, SORT_OPTIONS } from '../copy'
import { formatPrice } from '../derive'
import { categoryCountsQuery } from '../queries'
import { CATEGORIES, sortOf, type CatalogSearch } from '../search'

/**
 * Catalog filters (Catalog / Mobile Catalog boards). Desktop: one sticky glass
 * toolbar — category chips, search, segmented sort. Phones: chips as a swipe
 * row that sticks under the top bar, then search + a Sort button that opens a
 * bottom sheet. Everything lives in the URL (typed search params).
 */
export function CatalogControls({ search }: { search: CatalogSearch }) {
  return (
    <>
      {/* Desktop toolbar */}
      <div className="sticky top-[92px] z-20 mt-10 hidden flex-wrap items-center gap-3 rounded-[22px] border border-line bg-glass p-2.5 backdrop-blur-[16px] md:flex">
        <CategoryChips search={search} />
        {search.maxPrice !== undefined && <PriceChip search={search} />}
        <div className="ml-auto flex items-center gap-2">
          <SearchField search={search} className="h-11 w-[220px]" />
          <SortSegments search={search} />
        </div>
      </div>

      {/* Phone: sticky chip row, then search + sort */}
      <div className="sticky top-[70px] z-20 -mx-5 bg-[linear-gradient(var(--color-surface)_78%,transparent)] pb-2.5 pt-3.5 md:hidden">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChips search={search} />
          {search.maxPrice !== undefined && <PriceChip search={search} />}
        </div>
      </div>
      <div className="flex gap-2 pb-4 pt-1 md:hidden">
        <SearchField search={search} className="h-12 min-w-0 flex-1" />
        <SortSheet search={search} />
      </div>
    </>
  )
}

function CategoryChips({ search }: { search: CatalogSearch }) {
  const { data } = useQuery(categoryCountsQuery())
  const countOf = (category: (typeof CATEGORIES)[number] | undefined) =>
    category
      ? data?.categories.find((c) => c.category === category)?.productCount
      : data?.categories.reduce((sum, c) => sum + c.productCount, 0)

  return (
    <nav className="contents" aria-label="Category">
      {[undefined, ...CATEGORIES].map((category) => {
        const active = search.category === category
        const count = countOf(category)
        return (
          <Link
            key={category ?? 'ALL'}
            to="/products"
            search={{ ...search, category, page: undefined }}
            aria-current={active ? 'true' : undefined}
            className={`flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border pl-3.5 pr-2 text-sm font-semibold transition-colors md:pl-4 ${
              active ? 'border-brand bg-brand text-on-brand' : 'border-line-strong text-heading hover:bg-brand-soft'
            }`}
          >
            {category && <CategoryGlyph category={category} className="h-4 w-4 md:-ml-1 md:h-[18px] md:w-[18px]" />}
            {CATALOG_COPY[category ?? 'ALL'].chip}
            <span
              className={`grid h-[26px] min-w-[26px] place-items-center rounded-full px-[7px] font-mono text-[11px] ${
                active ? 'bg-on-brand/20' : 'bg-brand-soft'
              }`}
            >
              {count ?? '·'}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function PriceChip({ search }: { search: CatalogSearch }) {
  const label = `Under ${formatPrice(search.maxPrice!, 'EUR')}`
  return (
    <Link
      to="/products"
      search={{ ...search, maxPrice: undefined, page: undefined }}
      aria-label={`Remove price filter: ${label}`}
      className="flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-amber-line bg-amber-wash px-4 text-sm font-semibold text-amber-text transition hover:bg-amber-wash/70"
    >
      {label} <span aria-hidden="true">×</span>
    </Link>
  )
}

/** Live search: the URL follows the field after a short pause, so a pasted URL still reproduces the view. */
function SearchField({ search, className }: { search: CatalogSearch; className: string }) {
  const navigate = useNavigate({ from: '/products/' })
  const [value, setValue] = useState(search.q ?? '')
  const typed = useRef(false)

  // Follow outside changes (chips, "Clear filters", back button) unless the visitor is mid-typing.
  useEffect(() => {
    if (!typed.current) setValue(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    if (!typed.current) return
    const timer = setTimeout(() => {
      typed.current = false
      const q = value.trim()
      void navigate({ search: (prev) => ({ ...prev, q: q === '' ? undefined : q, page: undefined }), replace: true })
    }, 250)
    return () => clearTimeout(timer)
  }, [value, navigate])

  return (
    <label
      className={`flex items-center gap-2 rounded-full border border-line-strong bg-surface-raised px-4 text-ink-soft focus-within:border-brand ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <span className="sr-only">Search products</span>
      <input
        type="search"
        value={value}
        onChange={(event) => {
          typed.current = true
          setValue(event.target.value)
        }}
        placeholder="Search products…"
        className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/70 md:text-sm"
      />
    </label>
  )
}

function SortSegments({ search }: { search: CatalogSearch }) {
  const current = sortOf(search)
  return (
    <div role="group" aria-label="Sort" className="flex h-11 rounded-full border border-line-strong bg-surface-raised p-1">
      {SORT_OPTIONS.map((option) => {
        const active = current === option.value
        return (
          <Link
            key={option.value}
            to="/products"
            search={{ ...search, sort: sortParam(option.value), page: undefined }}
            aria-current={active ? 'true' : undefined}
            className={`flex h-[34px] items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
              active ? 'bg-brand-soft text-heading' : 'text-ink-soft hover:text-heading'
            }`}
          >
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}

function SortSheet({ search }: { search: CatalogSearch }) {
  const [open, setOpen] = useState(false)
  const current = sortOf(search)
  const label = SORT_OPTIONS.find((o) => o.value === current)?.label ?? 'Sort'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface-raised px-4 text-sm font-semibold text-heading transition active:scale-[0.97]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
        </svg>
        {label}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim-in fixed inset-0 z-40 bg-scrim backdrop-blur-[4px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="sheet-up fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-surface-raised px-5 pb-7 pt-2.5 shadow-lifted outline-none"
        >
          <div className="mx-auto mb-3.5 h-1 w-10 rounded bg-line-strong" aria-hidden="true" />
          <div className="flex items-center justify-between pb-2">
            <Dialog.Title className="font-display text-[22px] font-semibold text-heading">Sort by</Dialog.Title>
            <Dialog.Close aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full text-ink-soft">
              <CloseIcon />
            </Dialog.Close>
          </div>
          {SORT_OPTIONS.map((option) => {
            const active = current === option.value
            return (
              <Link
                key={option.value}
                to="/products"
                search={{ ...search, sort: sortParam(option.value), page: undefined }}
                onClick={() => setOpen(false)}
                aria-current={active ? 'true' : undefined}
                className={`mt-1 flex h-[52px] items-center justify-between rounded-2xl px-4 text-[15px] font-medium text-heading ${
                  active ? 'bg-brand-soft' : ''
                }`}
              >
                {option.label}
                {active && (
                  <svg className="text-brand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                )}
              </Link>
            )
          })}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Newest is the default, so it stays out of the URL. */
const sortParam = (sort: ProductSortDto) => (sort === 'newest' ? undefined : sort)

export function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
