import { getCartQueryKey, mergeCart } from '@ethereal-nature/api-client'
import type { QueryClient } from '@tanstack/react-query'
import { useMergeAdjustments } from './adjustments-store'
import { useGuestCart } from './guest-store'

/**
 * Merge-on-login (ADR-0007): post guest intents, then treat the response as
 * the one truth — replace the cart query, surface adjustments, clear the
 * guest store. Safe to re-fire: the server is idempotent per mergeId.
 * Returns true if there was anything to merge.
 */
export async function mergeGuestCartAfterLogin(queryClient: QueryClient): Promise<boolean> {
  const { mergeId, lines } = useGuestCart.getState()
  if (!mergeId || lines.length === 0) return false

  const { data } = await mergeCart({
    throwOnError: true,
    body: {
      mergeId,
      lines: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        priceSnapshotMinor: line.priceSnapshotMinor,
      })),
    },
  })

  queryClient.setQueryData(getCartQueryKey(), data.cart)
  useMergeAdjustments
    .getState()
    .show(data.adjustments, Object.fromEntries(lines.map((l) => [l.productId, l.name])))
  useGuestCart.getState().clear()
  return true
}
