import type { ProductCategoryDto } from '@ethereal-nature/api-client'
import type { CategoryTilesProps } from '@ethereal-nature/blocks-contract'
import { Art, type ArtName, useSpotlight } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { categoryCountsQuery } from '../../catalog/queries'
import { SectionHeading } from '../emphasis'

const ICON: Record<ProductCategoryDto, ArtName> = {
  OILS: 'icon-oils',
  HERBS: 'icon-herbs',
  CRYSTALS: 'icon-crystals',
  TEAS: 'icon-teas',
}

// Desktop: a soft radial from `raised` into the category placeholder colour.
// Mobile (board "Mobile · 390"): the same radial into `sand` for every tile.
// Full class names so Tailwind sees them.
const TILE_BG: Record<ProductCategoryDto, string> = {
  OILS: 'md:[--tile-tint:var(--color-ph-oils)]',
  HERBS: 'md:[--tile-tint:var(--color-ph-herbs)]',
  CRYSTALS: 'md:[--tile-tint:var(--color-ph-crystals)]',
  TEAS: 'md:[--tile-tint:var(--color-ph-teas)]',
}

/** Spotlight tint per category (the design's EN_CAT_RGB). */
const GLOW: Record<ProductCategoryDto, string> = {
  OILS: '232 176 79',
  HERBS: '120 190 110',
  CRYSTALS: '170 140 220',
  TEAS: '210 140 100',
}

export function CategoryTiles({ eyebrow, heading, tiles }: CategoryTilesProps) {
  const { data } = useQuery(categoryCountsQuery())
  const countOf = (category: ProductCategoryDto) =>
    data?.categories.find((c) => c.category === category)?.productCount
  const total = data?.categories.reduce((sum, c) => sum + c.productCount, 0)
  const browse = total !== undefined ? `Browse all ${total} products` : 'Browse all products'

  return (
    <section className="mx-auto w-full max-w-[1240px] px-5 py-12 md:px-6 md:py-24">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow={eyebrow} heading={heading} />
        <Link
          to="/products"
          className="rise rise-2 hidden text-sm font-semibold text-brand transition hover:text-heading md:block md:pb-2"
        >
          {browse} →
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 md:mt-12 md:gap-5 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          // The entrance rise lives on the <li>: an animation with fill "both"
          // on the link itself would pin its transform and kill the hover lift.
          <li key={tile.category} className="rise" style={{ animationDelay: `${i * 80}ms` }}>
            <CategoryTile tile={tile} count={countOf(tile.category)} />
          </li>
        ))}
      </ul>

      {/* Phones: a full-width button under the tiles (Mobile Home board). */}
      <Link
        to="/products"
        className="mt-4 flex h-[52px] items-center justify-center gap-2 rounded-full border border-line-strong text-sm font-semibold text-heading transition active:scale-[0.97] md:hidden"
      >
        {browse}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  )
}

function CategoryTile({
  tile,
  count,
}: {
  tile: CategoryTilesProps['tiles'][number]
  count: number | undefined
}) {
  const spotlight = useSpotlight()
  const x = spotlight.at ? Math.round(spotlight.at.x) : 50
  const y = spotlight.at ? Math.round(spotlight.at.y) : 40

  return (
    <Link
      to="/products"
      search={{ category: tile.category }}
      {...spotlight.bind}
      className={`art-hover group relative flex h-[214px] flex-col overflow-hidden rounded-[22px] border border-line bg-[radial-gradient(120%_90%_at_50%_30%,var(--color-surface-raised),var(--tile-tint))] shadow-card [--tile-tint:var(--color-sand-100)] transition-[transform,box-shadow] duration-[450ms] ease-[var(--ease-grow)] active:scale-[0.97] md:h-[440px] md:rounded-[28px] md:hover:-translate-y-1.5 md:hover:shadow-lifted md:active:scale-100 ${TILE_BG[tile.category]}`}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[350ms] group-hover:opacity-100"
        style={{
          background: `radial-gradient(240px circle at ${x}% ${y}%, light-dark(rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.06)), light-dark(rgb(${GLOW[tile.category]} / 0.38), rgb(${GLOW[tile.category]} / 0.3)) 40%, transparent 72%)`,
        }}
        aria-hidden="true"
      />
      {count !== undefined && (
        <span className="absolute left-2.5 top-2.5 rounded-full border border-line bg-glass px-[9px] py-1 font-mono text-[10px] text-heading md:left-4 md:top-4 md:px-3 md:py-1.5 md:text-[11px]">
          {count} {count === 1 ? 'product' : 'products'}
        </span>
      )}
      <Art name={ICON[tile.category]} className="relative mx-auto mt-[34px] w-[104px] md:mt-16 md:w-[200px]" />
      <span className="relative mt-auto flex items-end justify-between gap-3 px-3.5 pb-3.5 md:px-[22px] md:pb-[22px]">
        <span className="flex flex-col gap-0.5 md:gap-1">
          <span className="font-display text-[19px] font-semibold text-heading md:text-[28px]">{tile.label}</span>
          <span className="text-xs leading-[1.4] text-ink-soft md:text-sm">{tile.blurb}</span>
        </span>
        <span
          className="hidden h-11 w-11 flex-none place-items-center rounded-full border border-line-strong bg-surface-raised text-heading transition-transform duration-300 group-hover:translate-x-1 md:grid"
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </Link>
  )
}
