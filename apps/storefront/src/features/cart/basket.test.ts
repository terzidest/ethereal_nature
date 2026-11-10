import { describe, expect, it } from 'vitest'
import { shelfChanges, type BasketLine } from './useBasket'

const line = (extra: Partial<BasketLine>): BasketLine => ({
  productId: 'p',
  name: 'Amethyst Cluster',
  category: 'CRYSTALS',
  imageUrl: null,
  quantity: 2,
  unitMinor: 3250,
  totalMinor: 6500,
  currency: 'EUR',
  available: true,
  ...extra,
})

describe('shelfChanges', () => {
  it('says nothing when the shelf covers the basket', () => {
    expect(shelfChanges([line({ stock: 9 }), line({})])).toEqual([])
  })
  it('explains a quantity above stock and an unavailable line', () => {
    expect(shelfChanges([line({ stock: 1 }), line({ name: 'Sage', available: false })])).toEqual([
      'Amethyst Cluster now has 1 piece left — your quantity is capped at that.',
      'Sage is no longer available — remove it to continue.',
    ])
  })
})
