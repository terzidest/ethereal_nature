import type { ProductResponse } from '@ethereal-nature/api-client'
import { describe, expect, it } from 'vitest'
import { pairsFor } from './components/PairsWellWith'
import { sectionsOf } from './components/ProductDetails'

const product = (id: string, category: ProductResponse['category'], extra: Partial<ProductResponse> = {}) =>
  ({ id, category, name: id, description: `${id} description`, images: [], ...extra }) as unknown as ProductResponse

describe('pairsFor', () => {
  const self = product('self', 'OILS')

  it('takes two from the same shelf (never the product itself) and fills from other shelves', () => {
    const pairs = pairsFor(self, [self, product('o1', 'OILS'), product('o2', 'OILS')], [
      product('o3', 'OILS'),
      product('h1', 'HERBS'),
      product('t1', 'TEAS'),
      product('c1', 'CRYSTALS'),
    ])
    expect(pairs.map((p) => p.id)).toEqual(['o1', 'o2', 'h1', 't1'])
  })

  it('fills up to four from elsewhere when the shelf is thin', () => {
    const pairs = pairsFor(self, [self], [product('h1', 'HERBS'), product('t1', 'TEAS'), product('c1', 'CRYSTALS')])
    expect(pairs.map((p) => p.id)).toEqual(['h1', 't1', 'c1'])
  })
})

describe('sectionsOf', () => {
  it('drops "Origin & specs" when no spec is filled in', () => {
    expect(sectionsOf(product('p', 'TEAS')).map((s) => s.title)).toEqual(['Description', 'Shipping'])
  })

  it('lists only the specs the admin filled in', () => {
    const sections = sectionsOf(product('p', 'CRYSTALS', { origin: 'Brazil', weight: '420 g' }))
    expect(sections[1]).toMatchObject({ title: 'Origin & specs', rows: [{ k: 'Origin', v: 'Brazil' }, { k: 'Weight', v: '420 g' }] })
  })
})
