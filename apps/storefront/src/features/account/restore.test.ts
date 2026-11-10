import { describe, expect, it } from 'vitest'
import { restoreFailureAction } from './restore'

describe('restoreFailureAction', () => {
  it('clears the token when the API rejects it (401)', () => {
    expect(restoreFailureAction(401)).toBe('clear')
  })

  it('keeps the token when no response arrived (aborted / offline)', () => {
    expect(restoreFailureAction(undefined)).toBe('keep')
  })

  it('keeps the token on other HTTP errors', () => {
    for (const status of [403, 404, 429, 500, 502, 503]) {
      expect(restoreFailureAction(status)).toBe('keep')
    }
  })
})
