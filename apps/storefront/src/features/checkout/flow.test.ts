import { describe, expect, it } from 'vitest'
import { flowStepOf, safeRedirect, shortOrderId } from './flow'

describe('flowStepOf', () => {
  it('maps the flow routes to their step', () => {
    expect(flowStepOf('/cart')).toBe(0)
    expect(flowStepOf('/checkout')).toBe(1)
    expect(flowStepOf('/pay/abc')).toBe(2)
  })
  it('is null elsewhere', () => {
    expect(flowStepOf('/')).toBeNull()
    expect(flowStepOf('/products/x')).toBeNull()
    expect(flowStepOf('/orders/x')).toBeNull()
  })
})

describe('safeRedirect', () => {
  it('keeps same-site paths only', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout')
    expect(safeRedirect('//evil.example')).toBeUndefined()
    expect(safeRedirect('https://evil.example')).toBeUndefined()
    expect(safeRedirect(42)).toBeUndefined()
  })
})

it('shortOrderId is the first 8 characters', () => {
  expect(shortOrderId('4f2a9c1e-0000-4000-8000-000000000000')).toBe('4f2a9c1e')
})
