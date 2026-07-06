import {
  getCartQueryKey,
  setCartItemMutation,
  type ProductResponse,
} from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../account/session'
import { useCartSummary } from '../useCartSummary'
import { useGuestCart } from '../guest-store'
import { useCartUi } from '../ui-store'

export function AddToCartButton({ product, quantity = 1 }: { product: ProductResponse; quantity?: number }) {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const addGuestLine = useGuestCart((s) => s.addLine)
  const openDrawer = useCartUi((s) => s.openDrawer)
  const { serverCart } = useCartSummary()

  const mutation = useMutation({
    ...setCartItemMutation({ throwOnError: true }),
    onSuccess: (cart) => {
      queryClient.setQueryData(getCartQueryKey(), cart)
      openDrawer()
    },
  })

  if (product.stock === 0) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-400"
      >
        Out of stock
      </button>
    )
  }

  const add = () => {
    if (user) {
      const currentQty =
        serverCart.data?.lines.find((line) => line.productId === product.id)?.quantity ?? 0
      mutation.mutate({ body: { productId: product.id, quantity: currentQty + quantity } })
    } else {
      addGuestLine(
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          priceSnapshotMinor: product.priceMinor,
          currency: product.currency,
        },
        quantity,
      )
      openDrawer()
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={mutation.isPending}
      className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
    >
      {mutation.isPending ? 'Adding…' : 'Add to cart'}
    </button>
  )
}
