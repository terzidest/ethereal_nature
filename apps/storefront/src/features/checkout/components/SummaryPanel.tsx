import { useSpotlight } from '@ethereal-nature/ui'
import type { ReactNode } from 'react'

/**
 * The deep-green summary card shared by Basket and Review (Cart / Checkout
 * boards): eyebrow, item + packaging rows, a rolling total, then the action.
 * Text on `deep` is always light, in both themes.
 */
export function SummaryPanel({
  eyebrow,
  itemCount,
  itemsTotal,
  total,
  children,
}: {
  eyebrow: string
  itemCount: number
  itemsTotal: string
  total: string
  children: ReactNode
}) {
  const spotlight = useSpotlight('rgb(125 211 160 / 0.16)')
  return (
    <div
      {...spotlight.bind}
      className="relative flex flex-col gap-[22px] overflow-hidden rounded-[28px] bg-deep p-7 text-[#EEF4EF]"
    >
      <span className="aurora -right-[100px] -top-[120px] h-[280px] w-[280px] bg-[rgb(227_169_74/0.28)]" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-0" style={{ background: spotlight.background }} aria-hidden="true" />
      <span className="relative font-mono text-[11px] uppercase tracking-[0.14em] text-[#9FD8B4]">{eyebrow}</span>
      <div className="relative flex flex-col gap-3 text-[15px]">
        <div className="flex justify-between">
          <span className="text-[#EEF4EF]/70">Items ({itemCount})</span>
          <Rolling value={itemsTotal} className="leading-[22px]" height="h-[22px]" />
        </div>
        <div className="flex justify-between">
          <span className="text-[#EEF4EF]/70">Packaging</span>
          <span>Plastic-free</span>
        </div>
      </div>
      <div className="relative h-px bg-[#EEF4EF]/15" />
      <div className="relative flex items-baseline justify-between">
        <span className="text-[15px] text-[#EEF4EF]/70">Total</span>
        <Rolling value={total} height="h-[52px]" className="font-display text-[44px] font-semibold leading-[52px] tracking-[-0.02em]" />
      </div>
      {children}
    </div>
  )
}

/** Rolling figure: the key remounts it, so every change rolls in. */
export function Rolling({ value, className = '', height }: { value: string; className?: string; height: string }) {
  return (
    <span className={`block overflow-hidden ${height}`} aria-live="polite">
      <span key={value} className={`roll block ${className}`}>
        {value}
      </span>
    </span>
  )
}
