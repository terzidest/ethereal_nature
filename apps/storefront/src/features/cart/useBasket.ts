import { getCartQueryKey, setCartItemMutation, type CartResponse } from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../account/session'
import { useGuestCart } from './guest-store'
import { useCartSummary } from './useCartSummary'

/** One basket line, whichever cart it lives in. Prices are display-only (the server recomputes). */
export interface BasketLine {
  productId: string
  name: string
  category: string | undefined
  imageUrl: string | null | undefined
  quantity: number
  unitMinor: number
  totalMinor: number
  currency: string
  /** Stock cap when the server told us (signed-in cart). */
  stock?: number
  available: boolean
}

/**
 * The basket as the pages see it: the signed-in cart (React Query, server
 * truth) or the guest cart (Zustand intents with price snapshots), behind
 * one shape and one setQuantity. `restore` puts a removed line back (undo).
 */
export function useBasket() {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const { serverCart } = useCartSummary()
  const guest = useGuestCart()
  const mutation = useMutation({
    ...setCartItemMutation({ throwOnError: true }),
    onSuccess: (cart: CartResponse) => queryClient.setQueryData(getCartQueryKey(), cart),
  })

  const lines: BasketLine[] = user
    ? (serverCart.data?.lines ?? []).map((l) => ({
        productId: l.productId,
        name: l.name,
        category: l.category,
        imageUrl: l.imageUrl,
        quantity: l.quantity,
        unitMinor: l.unitPriceMinor,
        totalMinor: l.lineTotalMinor,
        currency: l.currency,
        stock: l.stock,
        available: l.available,
      }))
    : guest.lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        category: l.category,
        imageUrl: l.imageUrl,
        quantity: l.quantity,
        unitMinor: l.priceSnapshotMinor,
        totalMinor: l.priceSnapshotMinor * l.quantity,
        currency: l.currency,
        available: true,
      }))

  const setQuantity = (productId: string, quantity: number) => {
    if (user) mutation.mutate({ body: { productId, quantity } })
    else guest.setQuantity(productId, quantity)
  }

  const restore = (line: BasketLine) => {
    if (user) {
      mutation.mutate({ body: { productId: line.productId, quantity: line.quantity } })
    } else {
      guest.addLine(
        {
          productId: line.productId,
          name: line.name,
          category: line.category,
          imageUrl: line.imageUrl ?? null,
          priceSnapshotMinor: line.unitMinor,
          currency: line.currency,
        },
        line.quantity,
      )
    }
  }

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0)
  const subtotalMinor = user ? (serverCart.data?.subtotalMinor ?? 0) : lines.reduce((sum, l) => sum + l.totalMinor, 0)
  const currency = user ? (serverCart.data?.currency ?? 'EUR') : (lines[0]?.currency ?? 'EUR')

  return {
    isAuthenticated: user !== null,
    isLoading: user !== null && serverCart.isPending,
    isError: user !== null && serverCart.isError,
    lines,
    itemCount,
    subtotalMinor,
    currency,
    setQuantity,
    restore,
    isUpdating: mutation.isPending,
  }
}

/** Lines the shelf can't fully cover any more — what the "we updated your basket" notice explains. */
export function shelfChanges(lines: BasketLine[]): string[] {
  return lines.flatMap((line) => {
    if (!line.available) return [`${line.name} is no longer available — remove it to continue.`]
    if (line.stock !== undefined && line.quantity > line.stock) {
      return [`${line.name} now has ${line.stock} ${line.stock === 1 ? 'piece' : 'pieces'} left — your quantity is capped at that.`]
    }
    return []
  })
}
