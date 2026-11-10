import { describe, expect, it } from 'vitest'
import { categoryLabel, formatPrice, isNewProduct, NEW_FOR_DAYS } from './derive'

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

describe('isNewProduct', () => {
  const now = Date.UTC(2026, 10, 10)
  const daysAgo = (days: number) => (now - days * 86_400_000) / 1000

  it('is new inside the window and not after it', () => {
    expect(isNewProduct(daysAgo(1), now)).toBe(true)
    expect(isNewProduct(daysAgo(NEW_FOR_DAYS - 1), now)).toBe(true)
    expect(isNewProduct(daysAgo(NEW_FOR_DAYS), now)).toBe(false)
    expect(isNewProduct(daysAgo(400), now)).toBe(false)
  })
})
