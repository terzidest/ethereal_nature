import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
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
  notFoundComponent: ProductNotFound,
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
  errorComponent: ProductNotFound,
  component: ProductPage,
})

function ProductPage() {
  const { productId } = Route.useParams()
  const { data: product } = useQuery(productDetailQuery(productId))
  if (!product) return null

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <Link to="/products" className="text-sm text-brand-700 hover:text-brand-900">
        ← Back to shop
      </Link>
      <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
        {categoryLabel(product.category)}
      </span>
      <h1 className="text-4xl font-bold tracking-tight text-brand-900">{product.name}</h1>
      <p className="text-lg leading-relaxed text-ink/80">{product.description}</p>
      <div className="flex items-center gap-6">
        <span className="text-3xl font-bold text-brand-900">
          {formatPrice(product.priceMinor, product.currency)}
        </span>
        <span className={`text-sm font-medium ${product.stock > 0 ? 'text-brand-600' : 'text-red-600'}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </span>
      </div>
      {/* Add-to-cart arrives with the cart slice in Phase 3. */}
    </main>
  )
}

function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold text-brand-900">Product not found</h1>
      <p className="text-ink/70">It may have been removed from the catalog.</p>
      <Link to="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← Back to shop
      </Link>
    </main>
  )
}
