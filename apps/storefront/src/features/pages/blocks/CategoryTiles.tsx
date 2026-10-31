import { ProductArt } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { CATEGORIES } from '../../catalog/search'

export const categoryTilesSchema = z.object({
  heading: z.string(),
  tiles: z.array(
    z.object({
      category: z.enum(CATEGORIES),
      label: z.string(),
      blurb: z.string(),
    }),
  ),
})

export function CategoryTiles({ heading, tiles }: z.output<typeof categoryTilesSchema>) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <h2 className="font-display text-2xl font-semibold text-brand-900">{heading}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
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
  )
}
