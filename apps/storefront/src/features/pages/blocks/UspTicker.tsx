import type { UspTickerProps } from '@ethereal-nature/blocks-contract'

/** Values marquee on a sand band (spec §2.2). Decorative: the same values are said elsewhere in text. */
export function UspTicker({ items }: UspTickerProps) {
  // Two identical runs; the marquee slides by exactly one run (-50%) and loops.
  const run = (copy: number) =>
    items.map((item, i) => (
      <span key={`${copy}-${i}`} className="flex shrink-0 items-center gap-8 pr-8 md:gap-10 md:pr-10">
        <span>{item}</span>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-amber-accent" aria-hidden="true">
          <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        </svg>
      </span>
    ))

  return (
    <div className="overflow-hidden border-y border-line bg-sand-100 py-5 md:py-6" aria-hidden="true">
      <div className="marquee whitespace-nowrap font-display text-[20px] italic text-heading md:text-[26px]">
        {run(0)}
        {run(1)}
      </div>
    </div>
  )
}
