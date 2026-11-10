import { describe, expect, it } from 'vitest'
import { BLOCKS } from './blocks'

describe('block normalizers (untrusted server props → editor shape)', () => {
  it('hero: keeps a positive price ceiling, drops junk, leaves an old config without a trust row', () => {
    const hero = BLOCKS.hero.normalize({
      title: 'T',
      secondaryCta: { label: 'Under €15', maxPriceMinor: 1500, sort: 'bogus' },
    })
    expect(hero.secondaryCta).toEqual({ label: 'Under €15', sort: undefined, maxPriceMinor: 1500 })
    expect(hero.trust).toEqual([])
    expect(BLOCKS.hero.normalize({ secondaryCta: { maxPriceMinor: -3 } }).secondaryCta.maxPriceMinor).toBeUndefined()
    expect(BLOCKS.hero.normalize({ trust: ['a', 2, 'b', 'c', 'd', 'e'] }).trust).toEqual(['a', 'b', 'c', 'd'])
  })

  it('optional text props drop empty strings', () => {
    expect(BLOCKS.categoryTiles.normalize({ heading: 'H', eyebrow: '' }).eyebrow).toBeUndefined()
    expect(BLOCKS.valueProps.normalize({ items: [], heading: 'How *we* work' }).heading).toBe('How *we* work')
  })

  it('uspTicker never normalizes to an empty ticker', () => {
    expect(BLOCKS.uspTicker.normalize({ items: [] }).items).toEqual(BLOCKS.uspTicker.defaults.items)
    expect(BLOCKS.uspTicker.normalize({ items: ['One', 7] }).items).toEqual(['One'])
  })

  it('newsletter falls back to defaults for missing required text', () => {
    const n = BLOCKS.newsletter.normalize({})
    expect(n.heading).toBe(BLOCKS.newsletter.defaults.heading)
    expect(n.buttonLabel).toBe('Subscribe')
    expect(n.body).toBeUndefined()
  })
})
