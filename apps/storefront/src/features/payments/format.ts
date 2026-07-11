import type { PaymentIntentStatusDto } from '@ethereal-nature/api-client'

export const intentStatusCopy: Record<PaymentIntentStatusDto, { heading: string; note: string }> = {
  CREATED: {
    heading: 'Confirm your payment',
    note: 'This is a demo provider — no real money moves.',
  },
  SUCCEEDED: {
    heading: 'Payment complete',
    note: 'Your order is paid and on its way through fulfillment.',
  },
  FAILED: {
    heading: 'Payment declined',
    note: 'Nothing was charged. You can retry the payment from your order.',
  },
}
