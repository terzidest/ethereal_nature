import { listProductsOptions, type ProductResponse } from '@ethereal-nature/api-client'
import { ProductImage } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { AddToCartButton } from '../../features/cart/components/AddToCartButton'
import { ProductCard } from '../../features/catalog/components/ProductCard'
import { categoryLabel, formatPrice } from '../../features/catalog/derive'
import { productDetailQuery } from '../../features/catalog/queries'

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(productDetailQuery(params.productId))
    } catch (error) {
      // The backend answers 404/400 with an ErrorResponse body; anything the
      // catalog doesn't know is a proper HTTP 404 page, not a 500.
      const code = (error as { code?: string } | null)?.code
      if (code === 'PRODUCT_NOT_FOUND' || code === 'BAD_REQUEST') throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} | Ethereal Nature` },
          { name: 'description', content: loaderData.description },
          { property: 'og:title', content: loaderData.name },
          { property: 'og:description', content: loaderData.description },
          { property: 'og:type', content: 'product' },
          ...(loaderData.imageUrl ? [{ property: 'og:image', content: loaderData.imageUrl }] : []),
        ]
      : [{ title: 'Product | Ethereal Nature' }],
  }),
  notFoundComponent: ProductNotFound,
  component: ProductPage,
})

function ProductPage() {
  const { productId } = Route.useParams()
  const { data: product } = useQuery(productDetailQuery(productId))
  if (!product) return null

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-10">
      <div className="flex flex-col gap-8">
        <nav className="text-sm text-ink/50" aria-label="Breadcrumb">
          <Link to="/products" className="hover:text-brand-700">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <Link to="/products" search={{ category: product.category }} className="hover:text-brand-700">
            {categoryLabel(product.category)}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink/70">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-tile shadow-card">
            <ProductImage
              imageUrl={product.imageUrl}
              name={product.name}
              category={product.category}
              seed={product.slug}
              className="aspect-square w-full"
            />
          </div>

          <BuyBox product={product} />
        </div>
      </div>

      <RelatedProducts product={product} />
    </main>
  )
}

function BuyBox({ product }: { product: ProductResponse }) {
  const [quantity, setQuantity] = useState(1)
  const maxQuantity = Math.min(product.stock, 10)

  return (
    <div className="flex flex-col items-start gap-5 lg:py-4">
      <span className="text-xs font-medium uppercase tracking-widest text-brand-600">
        {categoryLabel(product.category)}
      </span>
      <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-brand-900">
        {product.name}
      </h1>
      <span className="font-display text-3xl font-semibold text-brand-900">
        {formatPrice(product.priceMinor, product.currency)}
      </span>
      <p className="text-lg leading-relaxed text-ink/70">{product.description}</p>

      <div className="flex items-center gap-2 text-sm font-medium">
        {product.stock === 0 ? (
          <span className="text-red-600">Out of stock</span>
        ) : product.stock <= 5 ? (
          <span className="text-amber-accent brightness-75">Only {product.stock} left in stock</span>
        ) : (
          <span className="text-brand-600">In stock, ships in 1–2 days</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {product.stock > 0 && (
          <label className="flex items-center gap-2 text-sm text-ink/70">
            Qty
            <select
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="rounded-full border border-brand-100 bg-surface-raised px-3 py-2 text-sm font-medium"
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <AddToCartButton product={product} quantity={quantity} />
      </div>

      <ul className="flex flex-col gap-1.5 border-t border-brand-100 pt-5 text-sm text-ink/60">
        <li>Free shipping over €35</li>
        <li>Plastic-free packaging</li>
        <li>30-day returns on unopened items</li>
      </ul>
    </div>
  )
}

function RelatedProducts({ product }: { product: ProductResponse }) {
  const { data } = useQuery(
    listProductsOptions({ query: { page: 1, pageSize: 5, category: product.category } }),
  )
  const related = (data?.items ?? []).filter((p) => p.id !== product.id).slice(0, 4)
  if (related.length === 0) return null

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold text-brand-900">
        More {categoryLabel(product.category).toLowerCase()}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="font-display text-2xl font-semibold text-brand-900">Product not found</h1>
      <p className="text-ink/70">It may have been removed from the catalog.</p>
      <Link to="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← Back to shop
      </Link>
    </main>
  )
}
