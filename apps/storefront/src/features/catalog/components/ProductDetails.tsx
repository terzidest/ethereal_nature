import type { ProductResponse } from '@ethereal-nature/api-client'
import { useId, useState } from 'react'
import { PRODUCT_COPY, SITE_PHOTOS } from '../copy'

interface Section {
  title: string
  rows: Array<{ k: string; v: string }>
  photo?: { src: string; alt: string }
}

/** Accordion sections for a product; spec rows only appear when the admin filled them in. */
export function sectionsOf(product: ProductResponse): Section[] {
  const specs = [
    { k: 'Origin', v: product.origin },
    { k: 'Size', v: product.size },
    { k: 'Weight', v: product.weight },
  ].filter((row): row is { k: string; v: string } => Boolean(row.v))

  return [
    { title: 'Description', rows: [{ k: 'About', v: product.description }] },
    ...(specs.length > 0 ? [{ title: 'Origin & specs', rows: specs }] : []),
    {
      title: 'Shipping',
      rows: [
        { k: 'Packaging', v: PRODUCT_COPY.packaging },
        { k: 'Dispatch', v: PRODUCT_COPY.dispatch },
      ],
      photo: { src: SITE_PHOTOS.packagingShipping, alt: 'An order packed in a recycled kraft box with paper tape' },
    },
  ]
}

/** Description / Origin & specs / Shipping — one open at a time, the first open by default (Product board). */
export function ProductDetails({ product }: { product: ProductResponse }) {
  const [open, setOpen] = useState(0)
  const id = useId()
  const sections = sectionsOf(product)

  return (
    <div className="md:border-t md:border-line">
      {sections.map((section, i) => {
        const expanded = open === i
        return (
          <div key={section.title} className="border-t border-line md:border-t-0 md:border-b">
            <h2>
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : i)}
                aria-expanded={expanded}
                aria-controls={expanded ? `${id}-${i}` : undefined}
                className="flex h-14 w-full items-center justify-between text-left text-base font-semibold text-heading md:min-h-[60px] md:font-display md:text-xl"
              >
                {section.title}
                <span
                  className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft font-sans text-lg text-brand"
                  aria-hidden="true"
                >
                  {expanded ? '−' : '+'}
                </span>
              </button>
            </h2>
            {expanded && (
              <div id={`${id}-${i}`} className="flex flex-col gap-2.5 pb-[18px] md:pb-[22px]">
                {section.rows.map((row) => (
                  <div key={row.k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 text-sm leading-[1.55] md:grid-cols-[120px_minmax(0,1fr)] md:gap-4 md:text-[15px]">
                    <span className="text-ink-soft md:pt-[3px] md:font-mono md:text-[11px] md:uppercase md:tracking-[0.1em] md:text-brand">{row.k}</span>
                    <span className="text-ink md:text-ink-soft">{row.v}</span>
                  </div>
                ))}
                {section.photo && (
                  <img
                    src={section.photo.src}
                    alt={section.photo.alt}
                    loading="lazy"
                    className="mt-1 block aspect-[16/10] w-full rounded-2xl bg-sand-100 object-cover md:mt-1.5 md:aspect-[3/2] md:rounded-[18px]"
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
