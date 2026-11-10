import type { ProductCategoryDto, ProductResponse } from '@ethereal-nature/api-client'
import { ProductImage, useTilt } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { categoryLabel, formatPrice, isLowStock, isNewProduct } from '../derive'

/** Photo placeholder per category — also what the blur-up starts from. Full class names for Tailwind. */
const PLACEHOLDER: Record<ProductCategoryDto, string> = {
  OILS: 'bg-ph-oils',
  HERBS: 'bg-ph-herbs',
  CRYSTALS: 'bg-ph-crystals',
  TEAS: 'bg-ph-teas',
}

/** Hover glow per category (the design's EN_GLOW). */
const GLOW: Record<ProductCategoryDto, string> = {
  OILS: '232 176 79',
  HERBS: '120 190 110',
  CRYSTALS: '170 140 220',
  TEAS: '210 140 100',
}

/**
 * Product card, as on the Home ("New arrivals") and Catalog boards: 4:5 photo
 * that tilts with a light sheen and a category glow, one amber badge at most,
 * category eyebrow, name and price (side by side on desktop, stacked on phones).
 *
 * `quickAdd` is a slot so the catalog slice doesn't reach into the cart. It
 * sits over the photo but outside the link (a button inside an <a> is
 * invalid); it shows on hover/focus with a pointer, always on touch.
 */
export function ProductCard({ product, quickAdd }: { product: ProductResponse; quickAdd?: ReactNode }) {
  const tilt = useTilt(8)
  const badge =
    product.stock === 0
      ? 'Out of stock'
      : isLowStock(product.stock)
        ? `Only ${product.stock} left`
        : isNewProduct(product.createdAtEpochSeconds)
          ? 'New'
          : null
  const price = formatPrice(product.priceMinor, product.currency)

  return (
    // Tilt listens on the whole card: the link's stretched ::after covers the photo.
    <article {...tilt.bind} className="group relative flex flex-col gap-2.5 md:gap-4">
      {/* No perspective/transform on this wrapper: it would form a stacking context and put the
          link's stretched ::after above the quick-add button. The tilt brings its own perspective(). */}
      <div className="relative">
        <div
          className={`relative aspect-[4/5] overflow-hidden rounded-[18px] transition-[transform,box-shadow] duration-200 ease-out md:rounded-[24px] ${PLACEHOLDER[product.category]} ${tilt.active ? 'shadow-lifted' : ''}`}
          style={tilt.style}
        >
          <ProductImage
            imageUrl={product.imageUrl}
            name={product.name}
            category={product.category}
            seed={product.slug}
            className="blur-up absolute inset-0 h-full w-full"
          />
          <span
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(${tilt.sheenAngle}deg, transparent 30%, rgb(255 255 255 / 0.75) 50%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `radial-gradient(70% 55% at 50% 30%, rgb(${GLOW[product.category]} / 0.45), transparent 72%)` }}
            aria-hidden="true"
          />
          {badge && (
            <span
              className={`absolute left-2.5 top-2.5 rounded-full px-[9px] py-1 text-[11px] font-semibold md:left-3.5 md:top-3.5 md:px-3 md:py-1.5 md:text-xs ${
                product.stock === 0 ? 'bg-heading/85 text-surface' : 'bg-amber-accent text-on-amber'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {quickAdd && product.stock > 0 && (
          <div className="absolute bottom-2 right-2 z-10 transition duration-300 md:inset-x-3.5 md:bottom-3.5 md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
            {quickAdd}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-0.5 md:flex-row md:items-start md:justify-between md:gap-3 md:px-1">
        <div className="flex min-w-0 flex-col gap-1 md:gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand md:text-[11px]">
            {categoryLabel(product.category)}
          </span>
          <Link
            to="/products/$productId"
            params={{ productId: product.id }}
            className="text-sm font-medium leading-[1.3] text-heading transition after:absolute after:inset-0 after:content-[''] hover:text-brand md:text-base md:leading-[1.35]"
          >
            {product.name}
          </Link>
        </div>
        <span className="whitespace-nowrap font-display text-[17px] font-semibold text-heading md:text-xl">{price}</span>
      </div>
    </article>
  )
}
