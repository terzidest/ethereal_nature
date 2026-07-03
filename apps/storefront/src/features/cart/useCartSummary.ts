import { getCartOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../account/session'
import { useGuestCart } from './guest-store'

/**
 * One facade over the two cart worlds: guest lines live in Zustand,
 * the authenticated cart is the React Query cache (server truth).
 */
export function useCartSummary() {
  const { user } = useSession()
  const guestLines = useGuestCart((s) => s.lines)
  const serverCart = useQuery({ ...getCartOptions(), enabled: user !== null })

  const itemCount = user
    ? (serverCart.data?.lines.reduce((n, line) => n + line.quantity, 0) ?? 0)
    : guestLines.reduce((n, line) => n + line.quantity, 0)

  return { isAuthenticated: user !== null, itemCount, serverCart, guestLines }
}
