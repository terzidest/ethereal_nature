import { beforeEach, describe, expect, it, vi } from 'vitest'

// The persisted store touches localStorage when it writes; give node a stub.
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
})
vi.stubGlobal('crypto', { randomUUID: () => `uuid-${storage.size}-${Math.random()}` })

const { useGuestCart } = await import('./guest-store')

const lavender = { productId: 'p1', name: 'Lavender', priceSnapshotMinor: 1450, currency: 'EUR' }

describe('guest cart store', () => {
  beforeEach(() => {
    useGuestCart.getState().clear()
  })

  it('mints a mergeId with the first line and keeps it for subsequent adds', () => {
    expect(useGuestCart.getState().mergeId).toBeNull()
    useGuestCart.getState().addLine(lavender)
    const mergeId = useGuestCart.getState().mergeId
    expect(mergeId).not.toBeNull()
    useGuestCart.getState().addLine({ ...lavender, productId: 'p2' })
    expect(useGuestCart.getState().mergeId).toBe(mergeId)
  })

  it('sums quantities for repeated adds of the same product', () => {
    useGuestCart.getState().addLine(lavender)
    useGuestCart.getState().addLine(lavender, 2)
    const line = useGuestCart.getState().lines[0]
    expect(useGuestCart.getState().lines).toHaveLength(1)
    expect(line?.quantity).toBe(3)
    // The snapshot from the first add is retained (display provenance).
    expect(line?.priceSnapshotMinor).toBe(1450)
  })

  it('setQuantity updates, and zero (or less) removes the line', () => {
    useGuestCart.getState().addLine(lavender)
    useGuestCart.getState().setQuantity('p1', 5)
    expect(useGuestCart.getState().lines[0]?.quantity).toBe(5)
    useGuestCart.getState().setQuantity('p1', 0)
    expect(useGuestCart.getState().lines).toHaveLength(0)
  })

  it('clear resets lines and the mergeId (a new cart gets a new idempotency key)', () => {
    useGuestCart.getState().addLine(lavender)
    const firstMergeId = useGuestCart.getState().mergeId
    useGuestCart.getState().clear()
    expect(useGuestCart.getState().lines).toHaveLength(0)
    expect(useGuestCart.getState().mergeId).toBeNull()
    useGuestCart.getState().addLine(lavender)
    expect(useGuestCart.getState().mergeId).not.toBe(firstMergeId)
  })
})
