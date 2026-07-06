import { listProductsOptions } from '@ethereal-nature/api-client'
import { ProductArt, type ArtCategory } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ProductCard } from '../features/catalog/components/ProductCard'

// Built lazily: hey-api captures the client baseUrl into the query key at
// creation time, and route modules load before configureApiClient() runs.
const newArrivalsQuery = () => listProductsOptions({ query: { page: 1, pageSize: 4, sort: 'newest' } })

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(newArrivalsQuery()),
  head: () => ({
    meta: [
      { title: 'Ethereal Nature — botanicals, oils, crystals & teas' },
      {
        name: 'description',
        content:
          'Small-batch essential oils, dried herbs, crystals, and loose-leaf teas, sourced with care.',
      },
    ],
  }),
  component: HomePage,
})

const categoryTiles: { category: ArtCategory; label: string; blurb: string }[] = [
  { category: 'OILS', label: 'Essential oils', blurb: 'Steam-distilled, single-origin' },
  { category: 'HERBS', label: 'Herbs', blurb: 'Dried whole, small harvests' },
  { category: 'CRYSTALS', label: 'Crystals', blurb: 'Hand-picked specimens' },
  { category: 'TEAS', label: 'Teas', blurb: 'Loose leaf, honest blends' },
]

function HomePage() {
  return (
    <main className="flex flex-col">
      <Hero />

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <h2 className="font-display text-2xl font-semibold text-brand-900">Shop by category</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryTiles.map((tile) => (
            <Link
              key={tile.category}
              to="/products"
              search={{ category: tile.category }}
              className="group overflow-hidden rounded-tile bg-surface-raised shadow-card transition hover:-translate-y-0.5 hover:shadow-lifted"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <ProductArt
                  category={tile.category}
                  seed={tile.category}
                  className="h-full w-full transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-0.5 px-5 py-4">
                <span className="font-semibold text-ink group-hover:text-brand-700">{tile.label}</span>
                <span className="text-sm text-ink/50">{tile.blurb}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <NewArrivals />

      <section className="border-y border-brand-100 bg-sand-100/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          {[
            ['Sourced with care', 'Every grower and cutter is someone we know by name.'],
            ['Small batches', 'Short runs, fresh stock — nothing sits in a warehouse for years.'],
            ['Plastic-free post', 'Recycled boxes, paper tape, no fillers.'],
          ].map(([title, blurb]) => (
            <div key={title} className="flex flex-col gap-1.5 text-center sm:text-left">
              <span className="font-display text-lg font-semibold text-brand-900">{title}</span>
              <span className="text-sm leading-relaxed text-ink/60">{blurb}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-surface to-sand-100">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 px-6 py-16 md:flex-row md:py-24">
        <div className="flex max-w-xl flex-col items-start gap-6">
          <span className="rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-800">
            New season harvest
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-brand-900 sm:text-5xl">
            Nature, bottled, dried & crystallised.
          </h1>
          <p className="text-lg leading-relaxed text-ink/70">
            Essential oils, herbs, crystals, and teas in small, honest batches — chosen slowly, shipped
            simply.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              Shop everything
            </Link>
            <Link
              to="/products"
              search={{ sort: 'price-asc' }}
              className="rounded-full bg-surface-raised px-8 py-3 text-sm font-semibold text-brand-900 shadow-card transition hover:bg-brand-50"
            >
              Under €15
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3 md:ml-auto" aria-hidden="true">
          <div className="translate-y-4 overflow-hidden rounded-tile shadow-lifted">
            <ProductArt category="OILS" seed="hero-oils" className="aspect-square w-full" />
          </div>
          <div className="overflow-hidden rounded-tile shadow-card">
            <ProductArt category="CRYSTALS" seed="hero-crystals" className="aspect-square w-full" />
          </div>
          <div className="translate-y-4 overflow-hidden rounded-tile shadow-card">
            <ProductArt category="TEAS" seed="hero-teas" className="aspect-square w-full" />
          </div>
          <div className="overflow-hidden rounded-tile shadow-lifted">
            <ProductArt category="HERBS" seed="hero-herbs" className="aspect-square w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}

function NewArrivals() {
  const { data } = useQuery(newArrivalsQuery())

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-14">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold text-brand-900">New arrivals</h2>
        <Link
          to="/products"
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
