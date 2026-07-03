import { describe, expect, it } from 'vitest'
import { pageOf, sortOf, validateCatalogSearch } from './search'

describe('validateCatalogSearch', () => {
  it('returns clean defaults for empty input', () => {
    const search = validateCatalogSearch({})
    expect(search).toEqual({ page: undefined, category: undefined, q: undefined, sort: undefined })
    expect(pageOf(search)).toBe(1)
    expect(sortOf(search)).toBe('newest')
  })

  it('keeps defaults out of the URL (page 1 and newest become undefined)', () => {
    expect(validateCatalogSearch({ page: '1', sort: 'newest' })).toEqual({
      page: undefined,
      category: undefined,
      q: undefined,
      sort: undefined,
    })
  })

  it('clamps garbage page values to 1', () => {
    expect(pageOf(validateCatalogSearch({ page: '-3' }))).toBe(1)
    expect(pageOf(validateCatalogSearch({ page: 'abc' }))).toBe(1)
    expect(validateCatalogSearch({ page: '4' }).page).toBe(4)
  })

  it('drops unknown categories and sorts rather than passing them through', () => {
    expect(validateCatalogSearch({ category: 'WEAPONS' }).category).toBeUndefined()
    expect(validateCatalogSearch({ category: 'TEAS' }).category).toBe('TEAS')
    expect(validateCatalogSearch({ sort: 'cheapest' }).sort).toBeUndefined()
    expect(validateCatalogSearch({ sort: 'price-asc' }).sort).toBe('price-asc')
  })

  it('trims search text and drops empty queries', () => {
    expect(validateCatalogSearch({ q: '  ' }).q).toBeUndefined()
    expect(validateCatalogSearch({ q: ' tea ' }).q).toBe('tea')
  })
})
