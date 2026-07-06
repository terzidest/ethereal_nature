import { create } from 'zustand'

/** Client ephemera (ADR-0008): whether the cart drawer is open. */
interface CartUiState {
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

export const useCartUi = create<CartUiState>()((set) => ({
  isDrawerOpen: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}))
