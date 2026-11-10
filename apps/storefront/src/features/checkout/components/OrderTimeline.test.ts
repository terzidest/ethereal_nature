import { describe, expect, it } from 'vitest'
import { timelineIndex } from './OrderTimeline'

describe('timelineIndex', () => {
  it('follows the status chain', () => {
    expect(timelineIndex('PLACED')).toBe(0)
    expect(timelineIndex('PAID')).toBe(1)
    expect(timelineIndex('SHIPPED')).toBe(3)
  })
})
