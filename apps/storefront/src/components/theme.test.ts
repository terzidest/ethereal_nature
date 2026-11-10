import { describe, expect, it } from 'vitest'
import { nextTheme } from './theme'

describe('nextTheme', () => {
  it('flips an explicit choice regardless of the device', () => {
    expect(nextTheme('light', true)).toBe('dark')
    expect(nextTheme('dark', false)).toBe('light')
  })

  it('flips away from what the device shows when nothing is saved', () => {
    expect(nextTheme('system', false)).toBe('dark')
    expect(nextTheme('system', true)).toBe('light')
  })
})
