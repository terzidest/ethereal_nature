import { describe, expect, it } from 'vitest'
import { categoryLabel, formatPrice } from './derive'

describe('formatPrice', () => {
  it('formats minor units as euros with a fixed locale', () => {
    expect(formatPrice(1450, 'EUR')).toBe('€14.50')
    expect(formatPrice(0, 'EUR')).toBe('€0.00')
    expect(formatPrice(329999, 'EUR')).toBe('€3,299.99')
  })
})

describe('categoryLabel', () => {
  it('title-cases enum names', () => {
    expect(categoryLabel('CRYSTALS')).toBe('Crystals')
    expect(categoryLabel('OILS')).toBe('Oils')
  })
})
