import type { OrderStatusDto } from '@ethereal-nature/api-client'

const STEPS: Array<{ code: OrderStatusDto; label: string }> = [
  { code: 'PLACED', label: 'Order placed' },
  { code: 'PAID', label: 'Payment received' },
  { code: 'PACKED', label: 'Packed' },
  { code: 'SHIPPED', label: 'Shipped' },
]

/** Where an order stands on PLACED → PAID → PACKED → SHIPPED (index of the last reached step). */
export const timelineIndex = (status: OrderStatusDto) => Math.max(0, STEPS.findIndex((s) => s.code === status))

/** The confirmation's status timeline (Checkout board "Done"): done steps in brand, the next one in amber. */
export function OrderTimeline({ status }: { status: OrderStatusDto }) {
  const reached = timelineIndex(status)
  return (
    <ol
      aria-label="Order status"
      className="rise rise-2 mt-2 grid w-full grid-cols-2 gap-3 rounded-[22px] border border-line bg-surface-raised p-5 text-left md:mt-4 md:grid-cols-4 md:rounded-[28px] md:p-6"
    >
      {STEPS.map((step, i) => {
        const done = i <= reached
        const next = i === reached + 1
        return (
          <li key={step.code} className="flex flex-col items-start gap-3" aria-current={i === reached ? 'step' : undefined}>
            <div className="flex w-full items-center gap-2.5">
              <span
                className={`grid h-8 w-8 flex-none place-items-center rounded-full border ${
                  done ? 'border-brand bg-brand text-on-brand' : next ? 'border-amber-accent' : 'border-line-strong'
                }`}
              >
                {done && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className={`h-0.5 flex-1 rounded ${i < reached ? 'bg-brand' : i === reached && reached < STEPS.length - 1 ? 'bg-amber-accent' : 'bg-line'}`} />
            </div>
            <span className={`font-mono text-[11px] tracking-[0.12em] ${done ? 'text-brand' : 'text-ink-soft'}`}>{step.code}</span>
            <span className="font-semibold text-heading">
              {step.label}
              <span className="sr-only">{done ? ' — done' : ' — not yet'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
