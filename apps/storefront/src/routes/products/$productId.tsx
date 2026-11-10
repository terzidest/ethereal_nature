import type { ProductCategoryDto } from '@ethereal-nature/api-client'
import { Art, type ArtName } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { AddToBasket } from '../../features/cart/components/AddToBasket'
import { PackingBand } from '../../features/catalog/components/PackingBand'
import { PairsWellWith } from '../../features/catalog/components/PairsWellWith'
import { ProductDetails } from '../../features/catalog/components/ProductDetails'
import { ProductGallery } from '../../features/catalog/components/ProductGallery'
import { StockMeter } from '../../features/catalog/components/StockMeter'
import { PRODUCT_COPY } from '../../features/catalog/copy'
import { categoryLabel, formatPrice, splitName } from '../../features/catalog/derive'
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
          { name: 'description', content: loaderData.summary ?? loaderData.description },
          { property: 'og:title', content: loaderData.name },
          { property: 'og:description', content: loaderData.summary ?? loaderData.description },
          { property: 'og:type', content: 'product' },
          ...(loaderData.imageUrl ? [{ property: 'og:image', content: loaderData.imageUrl }] : []),
        ]
      : [{ title: 'Product | Ethereal Nature' }],
  }),
  notFoundComponent: ProductNotFound,
  component: ProductPage,
})

const ICON: Record<ProductCategoryDto, ArtName> = {
  OILS: 'icon-oils',
  HERBS: 'icon-herbs',
  CRYSTALS: 'icon-crystals',
  TEAS: 'icon-teas',
}

function ProductPage() {
  const { productId } = Route.useParams()
  const { data: product } = useQuery(productDetailQuery(productId))
  // Quantity is shared by the desktop buy panel and the phone's sticky bar.
  const [quantity, setQuantity] = useState(1)
  if (!product) return null

  const crystals = product.category === 'CRYSTALS'
  const [first, rest] = splitName(product.name)
  const eyebrow = [categoryLabel(product.category), product.origin].filter(Boolean).join(' · ')

  return (
    <>
      <main className="relative mx-auto w-full max-w-[1240px] overflow-x-clip px-5 md:px-6 md:pt-10">
        <span
          className={`aurora -left-40 top-[120px] h-[340px] w-[340px] md:left-auto md:right-[-120px] md:top-0 md:h-[520px] md:w-[520px] ${
            crystals
              ? 'bg-[light-dark(rgb(180_150_230/0.40),rgb(140_100_220/0.30))]'
              : 'bg-[light-dark(rgb(122_196_148/0.40),rgb(60_160_105/0.30))]'
          }`}
          aria-hidden="true"
        />

        <nav
          aria-label="Breadcrumb"
          className="relative flex flex-wrap gap-2 pb-3 pt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft md:gap-2.5 md:p-0 md:text-xs"
        >
          <Link to="/products" className="hover:text-heading">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/products" search={{ category: product.category }} className="hover:text-heading">
            {categoryLabel(product.category)}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-heading" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="relative md:mt-7 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-start md:gap-10 lg:gap-16">
          <ProductGallery product={product} />

          <div className="flex flex-col gap-3.5 pt-[22px] md:sticky md:top-28 md:gap-7 md:pt-0">
            <div className="rise rise-1 flex flex-col gap-3.5">
              <span
                className={`inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] md:text-xs ${
                  crystals ? 'text-crystal-text md:text-brand' : 'text-brand'
                }`}
              >
                <Art name={ICON[product.category]} eager className="hidden w-7 md:block" />
                {eyebrow}
              </span>
              <h1 className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-heading md:text-[64px] md:leading-none">
                {first}
                {rest && (
                  <>
                    {' '}
                    <em className={`font-normal italic ${crystals ? 'md:text-crystal-text' : 'md:text-brand'}`}>{rest}</em>
                  </>
                )}
              </h1>
              <div className="flex items-baseline gap-2.5 md:gap-3.5">
                <span className="font-display text-[28px] font-semibold text-heading md:text-4xl">
                  {formatPrice(product.priceMinor, product.currency)}
                </span>
                <span className="text-[13px] text-ink-soft">incl. VAT</span>
              </div>
            </div>

            <p className="rise rise-2 text-[15px] leading-[1.65] text-ink-soft md:text-lg">
              {product.summary ?? product.description}
            </p>

            <div className="rise rise-2">
              <StockMeter stock={product.stock} />
            </div>

            <div className="rise rise-3 hidden md:block">
              <AddToBasket product={product} quantity={quantity} onQuantity={setQuantity} variant="panel" />
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft md:grid md:grid-cols-3 md:gap-2.5 md:text-[13px]">
              {PRODUCT_COPY.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-1.5 md:flex-col md:items-start md:gap-2 md:rounded-2xl md:bg-sand-100 md:p-3.5">
                  <svg className="h-3.5 w-3.5 text-brand md:h-[18px] md:w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>

            <div className="pt-3 md:pt-0">
              <ProductDetails product={product} />
            </div>
          </div>
        </div>
      </main>

      <PackingBand />
      <PairsWellWith product={product} />

      {/* Phones: the sticky buy bar replaces the tab bar on this page (MobileTabBar skips product pages). */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-glass px-4 pb-[max(env(safe-area-inset-bottom),22px)] pt-3 backdrop-blur-[16px] backdrop-saturate-[1.4] md:hidden">
        <AddToBasket product={product} quantity={quantity} onQuantity={setQuantity} variant="bar" />
      </div>
    </>
  )
}

function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
      <Art name="plate-ginkgo" className="w-[150px]" />
      <h1 className="font-display text-3xl font-semibold text-heading">This path grew over</h1>
      <p className="text-ink-soft">That product isn&apos;t on the shelf any more.</p>
      <Link
        to="/products"
        className="mt-2 inline-flex h-11 items-center rounded-full bg-brand px-6 font-semibold text-on-brand transition hover:bg-brand-deep"
      >
        Back to the shop
      </Link>
    </main>
  )
}
