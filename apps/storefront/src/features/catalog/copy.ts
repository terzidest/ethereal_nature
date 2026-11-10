import type { ProductCategoryDto } from '@ethereal-nature/api-client'

/**
 * Catalog title and blurb per category (redesign-spec §3 Catalog). Static
 * copy keyed by the fixed category enum — no CMS for this yet (plan §4.6).
 * The `em` part renders italic.
 */
export const CATALOG_COPY: Record<ProductCategoryDto | 'ALL', { title: string; em: string; blurb: string; chip: string }> = {
  ALL: {
    chip: 'All',
    title: 'Everything',
    em: 'we grow.',
    blurb: 'Essential oils, herbs, crystals and teas — every batch currently on the shelf.',
  },
  OILS: { chip: 'Oils', title: 'Essential', em: 'oils.', blurb: 'Steam-distilled and cold-pressed, single-origin.' },
  HERBS: { chip: 'Herbs', title: 'Dried', em: 'herbs.', blurb: 'Dried whole from small harvests.' },
  CRYSTALS: {
    chip: 'Crystals',
    title: 'Hand-picked',
    em: 'crystals.',
    blurb: 'Specimens chosen one by one — every piece unique.',
  },
  TEAS: { chip: 'Teas', title: 'Loose-leaf', em: 'teas.', blurb: 'Honest blends, no dust, no bags.' },
}

/** The three orders the boards offer. `name` stays valid in URLs, it just has no button. */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
] as const

/** Store-wide photos on the R2 media domain (plan §4.2) — the same for every product page. */
export const SITE_PHOTOS = {
  packingBand: 'https://img.terzidest.com/site/packing-band.webp',
  packagingShipping: 'https://img.terzidest.com/site/packaging-shipping.jpg',
} as const

/** Product page copy that is the same for every product (static until site settings exist, plan §4.6). */
export const PRODUCT_COPY = {
  perks: ['Sourced with care', 'Plastic-free post', 'Secure checkout'],
  packaging: 'Plastic-free post — recycled boxes, paper tape, no fillers.',
  dispatch: 'Packed and sent within 1–2 working days.',
} as const
