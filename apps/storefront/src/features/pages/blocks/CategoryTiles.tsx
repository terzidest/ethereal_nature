import { Art, type ArtName, useSpotlight } from '@ethereal-nature/ui'
import type { ProductCategoryDto } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { categoryCountsQuery } from '../../catalog/queries'
import { CATEGORIES } from '../../catalog/search'
import { SectionHeading } from '../emphasis'

export const categoryTilesSchema = z.object({
  eyebrow: z.string().optional(),
  /** `*words*` render italic. */
  heading: z.string(),
  tiles: z.array(
    z.object({
      category: z.enum(CATEGORIES),
      label: z.string(),
      blurb: z.string(),
    }),
  ),
})

const ICON: Record<ProductCategoryDto, ArtName> = {
  OILS: 'icon-oils',
  HERBS: 'icon-herbs',
  CRYSTALS: 'icon-crystals',
  TEAS: 'icon-teas',
}

// Full class names so Tailwind sees them.
const TILE_BG: Record<ProductCategoryDto, string> = {
  OILS: 'bg-ph-oils',
  HERBS: 'bg-ph-herbs',
  CRYSTALS: 'bg-ph-crystals',
  TEAS: 'bg-ph-teas',
}

export function CategoryTiles({ eyebrow, heading, tiles }: z.output<typeof categoryTilesSchema>) {
  const { data } = useQuery(categoryCountsQuery())
  const countOf = (category: ProductCategoryDto) =>
    data?.categories.find((c) => c.category === category)?.productCount
  const total = data?.categories.reduce((sum, c) => sum + c.productCount, 0)

  return (
    <section className="mx-auto w-full max-w-[1240px] px-5 py-12 md:px-6 md:py-24">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow={eyebrow} heading={heading} />
        <Link
          to="/products"
          className="rise rise-2 text-[15px] font-medium text-brand transition hover:text-heading md:pb-2"
        >
          {total !== undefined ? `Browse all ${total} products` : 'Browse all products'} →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:gap-5 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <CategoryTile key={tile.category} tile={tile} count={countOf(tile.category)} index={i} />
        ))}
      </div>
    </section>
  )
}

function CategoryTile({
  tile,
  count,
  index,
}: {
  tile: z.output<typeof categoryTilesSchema>['tiles'][number]
  count: number | undefined
  index: number
}) {
  const spotlight = useSpotlight()
  return (
    <Link
      to="/products"
      search={{ category: tile.category }}
      {...spotlight.bind}
      className={`art-hover rise group relative flex h-[214px] flex-col overflow-hidden rounded-[22px] p-4 shadow-card transition duration-300 ease-[var(--ease-grow)] hover:-translate-y-1 hover:shadow-lifted md:h-[440px] md:rounded-[28px] md:p-7 ${TILE_BG[tile.category]}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="pointer-events-none absolute inset-0" style={{ background: spotlight.background }} aria-hidden="true" />
      {count !== undefined && (
        <span className="relative self-start rounded-full bg-surface-raised/80 px-3 py-1 font-mono text-[11px] text-heading backdrop-blur">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
      <Art name={ICON[tile.category]} className="relative m-auto w-[64%] max-w-[200px] transition duration-500 group-hover:scale-105" />
      <span className="relative flex flex-col gap-0.5">
        <span className="font-display text-[19px] font-semibold text-heading md:text-[28px]">{tile.label}</span>
        <span className="text-[13px] leading-snug text-ink-soft md:text-[15px]">{tile.blurb}</span>
      </span>
    </Link>
  )
}
