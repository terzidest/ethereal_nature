import type { ProductResponse } from '@ethereal-nature/api-client'
import { ProductImage } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import { categoryLabel, formatPrice } from '../derive'

export function ProductCard({ product }: { product: ProductResponse }) {
  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group flex flex-col overflow-hidden rounded-tile bg-surface-raised shadow-card transition hover:-translate-y-0.5 hover:shadow-lifted"
    >
      <div className="relative aspect-square overflow-hidden">
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          category={product.category}
          seed={product.slug}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-accent px-3 py-1 text-xs font-semibold text-ink">
            Only {product.stock} left
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-3.5">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
          {categoryLabel(product.category)}
        </span>
        <span className="font-medium leading-snug text-ink group-hover:text-brand-700">{product.name}</span>
        <span className="mt-auto pt-1.5 font-display text-lg font-semibold text-brand-900">
          {formatPrice(product.priceMinor, product.currency)}
        </span>
      </div>
    </Link>
  )
}
