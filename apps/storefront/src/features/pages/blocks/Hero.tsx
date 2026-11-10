import { Art, useMagnetic } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { SORTS } from '../../catalog/search'
import { splitEmphasis } from '../emphasis'

export const heroSchema = z.object({
  eyebrow: z.string(),
  /** `*words*` render italic (see emphasis.tsx). */
  title: z.string(),
  subtitle: z.string(),
  primaryCta: z.object({ label: z.string() }),
  secondaryCta: z.object({
    label: z.string(),
    sort: z.enum(SORTS).optional(),
    /** Price ceiling in minor units for the catalog link ("Under €15" → 1500). */
    maxPriceMinor: z.number().int().positive().optional(),
  }),
  /** Short reassurance row under the buttons. */
  trust: z.array(z.string()).max(4).default([]),
})

const SEAL_TEXT = 'SMALL BATCH · SOURCED WITH CARE · '

export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, trust }: z.output<typeof heroSchema>) {
  const magnet = useMagnetic(12)
  let wordIndex = 0

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true">
        <span className="aurora -left-24 -top-32 h-[420px] w-[420px] bg-[light-dark(rgb(122_196_148/0.40),rgb(60_160_105/0.30))] md:h-[560px] md:w-[560px]" />
        <span className="aurora -right-24 top-40 h-[360px] w-[360px] bg-[light-dark(rgb(240_190_110/0.35),rgb(200_140_50/0.20))] [animation-delay:-5s] md:h-[480px] md:w-[480px]" />
        <span className="mote left-[12%] top-[22%] h-1.5 w-1.5 bg-amber-accent/70" />
        <span className="mote left-[46%] top-[70%] h-1 w-1 bg-brand/50 [animation-delay:-3s]" />
        <span className="mote right-[18%] top-[16%] h-2 w-2 bg-amber-accent/50 [animation-delay:-6s]" />
      </div>

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-[1.1fr_1fr] md:gap-12 md:px-6 md:pb-28 md:pt-20">
        <div className="flex flex-col items-start gap-6 md:gap-7">
          <span className="rise inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-raised/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-heading backdrop-blur md:text-xs">
            <span className="h-2 w-2 rounded-full bg-amber-accent" aria-hidden="true" />
            {eyebrow}
          </span>

          <h1 className="font-display text-[46px] font-semibold leading-none tracking-[-0.03em] text-heading md:text-[84px] md:leading-[0.98]">
            {splitEmphasis(title).map((part, p) => {
              const content = part.text.split(/(\s+)/).map((word, w) => {
                if (word.trim() === '') return word
                const delay = wordIndex++ * 80
                return (
                  <span key={w} className="word-mask">
                    <span style={{ animationDelay: `${delay}ms` }}>{word}</span>
                  </span>
                )
              })
              return part.em ? (
                <em key={p} className="font-normal italic text-brand">
                  {content}
                </em>
              ) : (
                <span key={p}>{content}</span>
              )
            })}
          </h1>

          <p className="rise rise-2 max-w-[520px] text-[16px] leading-[1.6] text-ink-soft md:text-[19px]">{subtitle}</p>

          <div className="rise rise-3 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/products"
              {...magnet.bind}
              style={magnet.style}
              className="inline-flex h-[54px] items-center justify-center rounded-full bg-brand px-8 text-[15px] font-semibold text-on-brand shadow-glow transition-[background-color] hover:bg-brand-deep"
            >
              {primaryCta.label}
            </Link>
            <Link
              to="/products"
              search={{
                ...(secondaryCta.sort ? { sort: secondaryCta.sort } : {}),
                ...(secondaryCta.maxPriceMinor ? { maxPrice: secondaryCta.maxPriceMinor } : {}),
              }}
              className="inline-flex h-[54px] items-center justify-center rounded-full border border-line-strong bg-surface-raised/60 px-8 text-[15px] font-semibold text-heading backdrop-blur transition hover:border-brand hover:text-brand"
            >
              {secondaryCta.label}
            </Link>
          </div>

          {trust.length > 0 && (
            <ul className="rise rise-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              {trust.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4 text-brand"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <HeroArt />
      </div>
    </section>
  )
}

/** Three botanical plates on a soft sun disc with a dashed ring and a rotating seal. No photos (spec §3). */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] md:max-w-[540px]" aria-hidden="true">
      <span className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_40%_35%,light-dark(#fbe7bf,rgb(240_190_104/0.18)),light-dark(#f5ddb0,rgb(240_190_104/0.06))_60%,transparent_72%)]" />
      <span className="absolute inset-[3%] rounded-full border border-dashed border-line-strong" />

      <Art name="plate-eucalyptus" eager className="rise rise-1 absolute left-[2%] top-[14%] w-[38%] -rotate-[8deg]" />
      <Art name="plate-lavender" eager className="rise rise-2 absolute left-[30%] top-[4%] w-[42%]" />
      <Art name="plate-chamomile" eager className="rise rise-3 absolute right-[2%] top-[22%] w-[36%] rotate-[7deg]" />

      <svg viewBox="0 0 120 120" className="spin-slow absolute bottom-[6%] right-[6%] h-24 w-24 md:h-32 md:w-32">
        <defs>
          <path id="hero-seal-circle" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
        </defs>
        <circle cx="60" cy="60" r="58" className="fill-surface-raised" />
        <circle cx="60" cy="60" r="18" className="fill-brand-soft" />
        <text className="fill-heading font-mono text-[10.5px] tracking-[0.18em]">
          <textPath href="#hero-seal-circle">{SEAL_TEXT}</textPath>
        </text>
      </svg>
    </div>
  )
}
