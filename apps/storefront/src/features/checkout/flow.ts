/** The four steps of the buying flow (Cart / Checkout boards). */
export const FLOW_STEPS = ['Basket', 'Review', 'Pay', 'Done'] as const

/** Which step a pathname belongs to; null outside the flow. /orders/<id> is Done but keeps the shop header. */
export function flowStepOf(pathname: string): number | null {
  if (pathname === '/cart') return 0
  if (pathname === '/checkout') return 1
  if (pathname.startsWith('/pay/')) return 2
  return null
}

/** First 8 characters of the order UUID — the short code shoppers see (plan §2.2). */
export const shortOrderId = (orderId: string) => orderId.slice(0, 8)

/** Only same-site paths are honoured as a post-login destination (no open redirects). */
export function safeRedirect(value: unknown): string | undefined {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined
}
