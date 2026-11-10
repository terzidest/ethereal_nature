import type { ProductResponse } from '@ethereal-nature/api-client'
import { ProductImage, useTilt } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { categoryLabel, formatPrice, isNewProduct } from '../derive'

/**
 * Product card (redesign-spec §2 "New arrivals" / §3 Catalog): 4:5 photo,
 * one badge at most, category eyebrow, name, price. `quickAdd` is a slot so
 * the catalog slice doesn't reach into the cart; it sits outside the link
 * (a button inside an <a> is invalid) and shows on hover/focus, always on touch.
 */
export function ProductCard({ product, quickAdd }: { product: ProductResponse; quickAdd?: ReactNode }) {
  const tilt = useTilt(8)
  const badge =
    product.stock === 0
      ? { label: 'Out of stock', className: 'bg-heading/85 text-surface' }
      : product.stock <= 5
        ? { label: `Only ${product.stock} left`, className: 'bg-amber-accent text-on-amber' }
        : isNewProduct(product.createdAtEpochSeconds)
          ? { label: 'New', className: 'bg-surface-raised/90 text-heading' }
          : null

  return (
    // Tilt listens on the whole card: the link's stretched ::after covers the photo.
    <article {...tilt.bind} className="group relative flex flex-col gap-3.5">
      <div className="relative">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-sand-100 shadow-card transition-[transform,box-shadow] duration-300 ease-[var(--ease-grow)] group-hover:shadow-lifted max-md:rounded-[18px]"
          style={tilt.style}
        >
          <ProductImage
            imageUrl={product.imageUrl}
            name={product.name}
            category={product.category}
            seed={product.slug}
            className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
          />
          {tilt.active && (
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(${tilt.sheenAngle}deg, transparent 35%, rgb(255 255 255 / 0.22) 50%, transparent 65%)`,
              }}
              aria-hidden="true"
            />
          )}
          {badge && (
            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] backdrop-blur ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        {quickAdd && product.stock > 0 && (
          <div className="absolute bottom-3 right-3 z-10 transition duration-300 md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
            {quickAdd}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
          {categoryLabel(product.category)}
        </span>
        <Link
          to="/products/$productId"
          params={{ productId: product.id }}
          className="font-medium leading-snug text-ink transition after:absolute after:inset-0 after:content-[''] hover:text-brand max-md:text-[15px]"
        >
          {product.name}
        </Link>
        <span className="font-display text-xl font-semibold text-heading max-md:text-[17px]">
          {formatPrice(product.priceMinor, product.currency)}
        </span>
      </div>
    </article>
  )
}
