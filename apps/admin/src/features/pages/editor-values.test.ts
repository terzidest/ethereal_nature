import { manifest } from '@ethereal-nature/blocks-contract'
import { describe, expect, it } from 'vitest'
import { blockDefaults, editorValue, summarize } from './editor-values'

describe('editor values (untrusted server props → editor shape, strict policy)', () => {
  it('valid props parse to the total output shape (schema defaults applied)', () => {
    const hero = editorValue('hero', {
      eyebrow: 'E',
      title: 'T',
      subtitle: 'S',
      primaryCta: { label: 'P' },
      secondaryCta: { label: 'Under €15', maxPriceMinor: 1500 },
      // no trust row in old configs → schema default keeps it empty
    })
    expect(hero.secondaryCta).toEqual({ label: 'Under €15', maxPriceMinor: 1500 })
    expect(hero.trust).toEqual([])
  })

  it('an entry that fails its schema falls back to the block defaults, whole entry', () => {
    const corrupt = editorValue('hero', {
      title: 42, // wrong type ⇒ strict policy: the entry resets, not the field
    })
    expect(corrupt).toEqual(blockDefaults('hero'))
  })

  it('blockDefaults are total output values, safe to seed a new block with', () => {
    expect(blockDefaults('newsletter').buttonLabel).toBe('Subscribe')
    expect(blockDefaults('productStrip')).toMatchObject({ sort: 'newest', limit: 4 })
    expect(blockDefaults('uspTicker').items.length).toBeGreaterThan(0)
  })

  it('summarize reports valid entries via the manifest summary', () => {
    expect(summarize('newsletter', manifest.newsletter.defaults)).toBe('Hear when the next batch is ready.')
    expect(summarize('uspTicker', { items: ['One', 'Two'] })).toBe('One · Two')
  })

  it('summarize says so for invalid entries instead of pretending', () => {
    expect(summarize('hero', { title: 42 })).toBe('Invalid props — editing restores defaults')
  })
})
