import { createPaymentIntentMutation } from '@ethereal-nature/api-client'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

/**
 * Creates the payment intent for an order (idempotent server-side: an open
 * intent is returned instead of duplicated) and moves the user to the mock
 * provider page. The order exists regardless, so a failed intent creation
 * falls back to the order page — never a dead end.
 */
export function useStartPayment() {
  const navigate = useNavigate()
  const mutation = useMutation(createPaymentIntentMutation({ throwOnError: true }))

  const start = (orderId: string) => {
    mutation.mutate(
      { body: { orderId } },
      {
        onSuccess: (intent) =>
          void navigate({ to: '/pay/$intentId', params: { intentId: intent.id } }),
        onError: () => void navigate({ to: '/orders/$orderId', params: { orderId } }),
      },
    )
  }

  return { start, isPending: mutation.isPending }
}
