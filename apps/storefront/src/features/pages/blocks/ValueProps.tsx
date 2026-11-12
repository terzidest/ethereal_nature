import type { ValuePropsProps } from '@ethereal-nature/blocks-contract'
import { Art } from '@ethereal-nature/ui'
import { Emphasised } from '../emphasis'

/** "How we work": a deep green panel, bouquet art left, numbered values right (spec §2.5). */
export function ValueProps({ eyebrow, heading, caption, items }: ValuePropsProps) {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-5 py-12 md:px-6 md:py-20">
      <div className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-deep p-6 text-[#EEF4EF] shadow-lifted md:grid-cols-[1fr_1.1fr] md:gap-14 md:rounded-[36px] md:p-14">
        <figure className="flex flex-col items-center gap-4">
          {/* The art outline is fixed light here: the panel is dark in both themes. */}
          <Art name="bouquet" className="w-full max-w-[300px] md:max-w-[420px]" style={{ ['--color-art-ink' as string]: 'rgb(238 244 239 / 0.7)' }} />
          {caption && (
            <figcaption className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-[#EEF4EF]/60">
              {caption}
            </figcaption>
          )}
        </figure>

        <div className="flex flex-col gap-8">
          {(eyebrow || heading) && (
            <div className="flex flex-col gap-3">
              {eyebrow && <span className="rise font-mono text-[11px] uppercase tracking-[0.14em] text-[#9FD8B4] md:text-xs">{eyebrow}</span>}
              {heading && (
                <h2 className="rise rise-1 font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[52px] md:leading-[1.05]">
                  <Emphasised text={heading} emClassName="text-[#F0C27A]" />
                </h2>
              )}
            </div>
          )}
          <ol className="flex flex-col divide-y divide-white/10">
            {items.map(({ title, blurb }, i) => (
              <li key={title} className="rise flex gap-5 py-4 first:pt-0 last:pb-0" style={{ animationDelay: `${(i + 2) * 80}ms` }}>
                <span className="pt-1 font-mono text-xs text-[#F0C27A]">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-[20px] font-semibold md:text-[24px]">{title}</span>
                  <span className="text-[15px] leading-relaxed text-[#EEF4EF]/70 md:text-[16px]">{blurb}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
