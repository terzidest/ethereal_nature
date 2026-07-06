import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * The guest (pre-auth) cart — the ONLY place a pre-auth cart exists
 * (ADR-0007). Lines are intents: productId + quantity. Price/name are
 * display-only snapshots from the moment of adding; the server recomputes
 * all money at merge and checkout.
 */
export interface GuestCartLine {
  productId: string
  name: string
  /** Display metadata for artwork; older persisted carts may lack it. */
  category?: string
  quantity: number
  priceSnapshotMinor: number
  currency: string
}

interface GuestCartState {
  /** Client-generated idempotency key for the next merge (new one per cart). */
  mergeId: string | null
  lines: GuestCartLine[]
  addLine: (line: Omit<GuestCartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      mergeId: null,
      lines: [],
      addLine: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId)
          return {
            mergeId: state.mergeId ?? crypto.randomUUID(),
            lines: existing
              ? state.lines.map((l) =>
                  l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l,
                )
              : [...state.lines, { ...line, quantity }],
          }
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
        })),
      clear: () => set({ mergeId: null, lines: [] }),
    }),
    {
      name: 'ethereal-nature.guest-cart',
      storage: createJSONStorage(() => localStorage),
      // SSR renders the empty initial state; we rehydrate in an effect so
      // the first client render matches the server HTML.
      skipHydration: true,
    },
  ),
)
