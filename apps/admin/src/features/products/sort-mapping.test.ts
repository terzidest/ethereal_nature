import { describe, expect, it } from 'vitest'
import { SORTS } from './search'
import { sortingToSort, sortToSorting } from './components/ProductsTable'

describe('table sorting ↔ API sort vocabulary', () => {
  it('round-trips every API sort value', () => {
    for (const sort of SORTS) {
      expect(sortingToSort(sortToSorting(sort))).toBe(sort)
    }
  })

  it('maps unknown or empty sorting state to newest', () => {
    expect(sortingToSort([])).toBe('newest')
    expect(sortingToSort([{ id: 'stock', desc: true }])).toBe('newest')
  })
})
