import type { ProductCategoryDto, ProductResponse } from '@ethereal-nature/api-client'
import { ProductImage, useTilt } from '@ethereal-nature/ui'
import { useRef, useState, type UIEvent } from 'react'
import { isLowStock } from '../derive'

const PLACEHOLDER: Record<ProductCategoryDto, string> = {
  OILS: 'bg-ph-oils',
  HERBS: 'bg-ph-herbs',
  CRYSTALS: 'bg-ph-crystals',
  TEAS: 'bg-ph-teas',
}

interface Shot {
  url: string | null
  label: string
}

/** The gallery in upload order; a product with no images still shows one (fallback art). */
export function shotsOf(product: ProductResponse): Shot[] {
  if (product.images.length > 0) {
    return product.images.map((image, i) => ({ url: image.url, label: image.label ?? `Photo ${i + 1}` }))
  }
  return [{ url: product.imageUrl ?? null, label: product.name }]
}

/**
 * Product gallery (Product / Mobile Product boards). One photo: just the
 * stage. Two or more: thumbnails in upload order on desktop; on phones a
 * full-width swipe with dots and an "n / N" counter.
 */
export function ProductGallery({ product }: { product: ProductResponse }) {
  const shots = shotsOf(product)
  return (
    <>
      <DesktopGallery product={product} shots={shots} />
      <MobileGallery product={product} shots={shots} />
    </>
  )
}

function StockBadge({ product, className }: { product: ProductResponse; className: string }) {
  if (product.stock === 0) {
    return <span className={`${className} rounded-full bg-heading/85 font-semibold text-surface`}>Out of stock</span>
  }
  if (!isLowStock(product.stock)) return null
  return <span className={`${className} rounded-full bg-amber-accent font-semibold text-on-amber`}>Only {product.stock} left</span>
}

function DesktopGallery({ product, shots }: { product: ProductResponse; shots: Shot[] }) {
  const [active, setActive] = useState(0)
  const tilt = useTilt(5)
  const shot = shots[active] ?? shots[0]!
  const multi = shots.length > 1

  return (
    <div className={`rise hidden gap-4 md:grid ${multi ? 'grid-cols-[88px_minmax(0,1fr)]' : ''}`}>
      {multi && (
        <div role="group" aria-label="Product photos" className="flex flex-col gap-3">
          {shots.map((s, i) => (
            <button
              key={`${s.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${s.label}`}
              aria-pressed={i === active}
              className={`relative h-[110px] w-[88px] overflow-hidden rounded-2xl border-2 transition hover:-translate-y-0.5 ${PLACEHOLDER[product.category]} ${
                i === active ? 'border-brand opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <ProductImage imageUrl={s.url} name="" category={product.category} seed={`${product.slug}-${i}`} className="absolute inset-0 h-full w-full" />
            </button>
          ))}
        </div>
      )}
      <div {...tilt.bind} className="group">
        <div
          className={`relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-lifted transition-transform duration-200 ease-out ${PLACEHOLDER[product.category]}`}
          style={tilt.style}
        >
          {/* The key remounts the photo, so each pick blurs up again. */}
          <ProductImage
            key={active}
            imageUrl={shot.url}
            name={`${product.name} — ${shot.label}`}
            category={product.category}
            seed={`${product.slug}-${active}`}
            className="blur-up absolute inset-0 h-full w-full"
          />
          <span
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `linear-gradient(${tilt.sheenAngle}deg, transparent 30%, rgb(255 255 255 / 0.7) 50%, transparent 70%)` }}
            aria-hidden="true"
          />
          <StockBadge product={product} className="absolute left-[18px] top-[18px] px-3.5 py-[7px] text-xs" />
          {multi && (
            <span className="absolute bottom-[18px] right-[18px] rounded-full border border-line bg-glass px-3.5 py-2 font-mono text-[11px] text-heading backdrop-blur-[12px]">
              {active + 1} / {shots.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileGallery({ product, shots }: { product: ProductResponse; shots: Shot[] }) {
  const [active, setActive] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const multi = shots.length > 1
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <section aria-label="Photos" className="relative -mx-5 md:hidden">
      <div
        ref={track}
        onScroll={multi ? onScroll : undefined}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shots.map((s, i) => (
          <div key={`${s.url}-${i}`} className={`relative aspect-[4/5] w-full flex-none snap-center ${PLACEHOLDER[product.category]}`}>
            <ProductImage
              imageUrl={s.url}
              name={`${product.name} — ${s.label}`}
              category={product.category}
              seed={`${product.slug}-${i}`}
              className="blur-up absolute inset-0 h-full w-full"
            />
          </div>
        ))}
      </div>
      <StockBadge product={product} className="absolute left-4 top-3.5 px-[11px] py-1.5 text-xs" />
      {multi && (
        <>
          <span className="absolute right-4 top-3.5 rounded-full border border-line bg-glass px-[11px] py-1.5 font-mono text-xs text-heading backdrop-blur-[12px]">
            {active + 1} / {shots.length}
          </span>
          <div className="flex justify-center gap-2 pt-3" aria-hidden="true">
            {shots.map((s, i) => (
              <span
                key={`${s.url}-${i}`}
                className={`h-1.5 rounded-full transition-[width] duration-300 ${i === active ? 'w-[22px] bg-brand' : 'w-1.5 bg-line-strong'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
