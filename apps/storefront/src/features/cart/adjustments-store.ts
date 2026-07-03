import type { AdjustmentsDto } from '@ethereal-nature/api-client'
import { create } from 'zustand'

/** Ephemeral: the last merge's adjustments report, until dismissed. */
interface AdjustmentsState {
  adjustments: AdjustmentsDto | null
  /** Guest-side names captured at merge time, for readable messages. */
  productNames: Record<string, string>
  show: (adjustments: AdjustmentsDto, productNames: Record<string, string>) => void
  dismiss: () => void
}

export const useMergeAdjustments = create<AdjustmentsState>()((set) => ({
  adjustments: null,
  productNames: {},
  show: (adjustments, productNames) => set({ adjustments, productNames }),
  dismiss: () => set({ adjustments: null, productNames: {} }),
}))

export function hasAdjustments(adjustments: AdjustmentsDto | null): adjustments is AdjustmentsDto {
  return (
    adjustments !== null &&
    (adjustments.dropped.length > 0 || adjustments.clamped.length > 0 || adjustments.priceChanged.length > 0)
  )
}
