import { describe, expect, it } from 'vitest'
import { knownBlockTypes, manifest } from './manifest'

describe('manifest', () => {
  it('covers exactly the known block types', () => {
    expect(knownBlockTypes).toEqual([
      'hero',
      'uspTicker',
      'categoryTiles',
      'productStrip',
      'valueProps',
      'newsletter',
    ])
  })

  // The admin seeds new blocks from `defaults` and falls back to
  // `schema.parse(defaults)` for entries that fail validation — so every
  // block's defaults must parse, or that fallback could itself throw.
  it.each(knownBlockTypes)('defaults for "%s" parse against the schema', (type) => {
    const { schema, defaults } = manifest[type]
    const result = schema.safeParse(defaults)
    expect(
      result.success,
      result.success ? '' : JSON.stringify(result.error.issues),
    ).toBe(true)
  })

  it('every block carries a label and a summary', () => {
    for (const type of knownBlockTypes) {
      expect(manifest[type].label).toBeTruthy()
      expect(typeof manifest[type].summary).toBe('function')
    }
  })
})
