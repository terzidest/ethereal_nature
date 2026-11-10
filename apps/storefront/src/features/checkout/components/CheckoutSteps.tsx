import { FLOW_STEPS } from '../flow'

/** Desktop header pills: Basket · Review · Pay · Done (hidden below 900px, as on the boards). */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Checkout progress" className="mx-auto hidden items-center gap-2 text-[13px] font-semibold min-[900px]:flex">
      {FLOW_STEPS.map((label, i) => {
        const done = i < current
        const now = i === current
        return (
          <li key={label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className={`h-px w-6 ${i <= current ? 'bg-brand' : 'bg-line-strong'}`} />}
            <span
              aria-current={now ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 ${now ? 'bg-brand-soft' : ''} ${done || now ? 'text-heading' : 'text-ink-soft'}`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full border font-mono text-[11px] ${
                  done || now ? 'border-brand bg-brand text-on-brand' : 'border-line-strong text-ink-soft'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Phones: "Step n of 4 · …" with a 4-segment progress line. */
export function StepProgress({ current, label }: { current: number; label: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">
        Step {current + 1} of {FLOW_STEPS.length} · {label}
      </span>
      <div className="grid grid-cols-4 gap-1.5 md:hidden" aria-hidden="true">
        {FLOW_STEPS.map((step, i) => (
          <span key={step} className={`h-1 rounded-full ${i <= current ? 'bg-brand' : 'bg-line-strong'}`} />
        ))}
      </div>
    </div>
  )
}
