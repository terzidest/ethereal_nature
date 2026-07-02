import type { ProductResponse } from '@ethereal-nature/api-client'
import { Link } from '@tanstack/react-router'
import { categoryLabel, formatPrice } from '../derive'

export function ProductCard({ product }: { product: ProductResponse }) {
  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group flex flex-col gap-2 rounded-card border border-brand-100 bg-white p-5 transition hover:border-brand-500"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
        {categoryLabel(product.category)}
      </span>
      <span className="text-lg font-semibold text-ink group-hover:text-brand-700">{product.name}</span>
      <span className="line-clamp-2 text-sm text-ink/70">{product.description}</span>
      <span className="mt-auto flex items-baseline justify-between pt-2">
        <span className="text-lg font-bold text-brand-900">
          {formatPrice(product.priceMinor, product.currency)}
        </span>
        <span className={`text-xs ${product.stock > 0 ? 'text-brand-600' : 'text-red-600'}`}>
          {product.stock > 0 ? 'In stock' : 'Out of stock'}
        </span>
      </span>
    </Link>
  )
}
