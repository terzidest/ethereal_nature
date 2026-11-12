import type { HeroProps } from '@ethereal-nature/blocks-contract'
import { Art, BranchGlyph, useMagnetic } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import { splitEmphasis } from '../emphasis'

const SEAL_TEXT = 'SMALL BATCH · SOURCED WITH CARE · '

export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, trust }: HeroProps) {
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

      {/* 1240px of content inside the gutters, as on the board (other sections are 1240 including them). */}
      <div className="relative mx-auto grid max-w-[1288px] grid-cols-[minmax(0,1fr)] items-center gap-6 px-5 pb-12 pt-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-16 md:px-6 md:pb-24 md:pt-[84px]">
        <div className="flex flex-col items-start gap-6 md:gap-7">
          <span className="rise inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">
            <span className="h-2 w-2 flex-none rounded-full bg-amber-accent shadow-[0_0_0_4px_light-dark(rgb(232_176_79/0.25),rgb(240_190_104/0.22))]" aria-hidden="true" />
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
              className="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-brand px-7 text-[15px] font-semibold text-on-brand shadow-glow transition-[background-color] hover:bg-brand-deep md:h-14"
            >
              {primaryCta.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              to="/products"
              search={{
                ...(secondaryCta.sort ? { sort: secondaryCta.sort } : {}),
                ...(secondaryCta.maxPriceMinor ? { maxPrice: secondaryCta.maxPriceMinor } : {}),
              }}
              className="inline-flex h-[54px] items-center justify-center rounded-full border border-line-strong bg-glass px-7 md:h-14 text-[15px] font-semibold text-heading backdrop-blur transition hover:border-brand hover:text-brand"
            >
              {secondaryCta.label}
            </Link>
          </div>

          {trust.length > 0 && (
            <ul className="rise rise-4 flex flex-wrap gap-x-7 gap-y-2 pt-1 text-[13px] text-ink-soft md:pt-3">
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

/**
 * The botanical composition from the Home boards: a 570×600 box with a soft
 * sun disc and dashed ring, three overlapping plates (eucalyptus, lavender,
 * chamomile), a horizon line and the rotating seal top-right. Positions are
 * the board's, as percentages of that box, so phones get the same picture
 * scaled down (the mobile board scales it to 0.57). No photos (spec §3).
 */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-[570/600] w-full max-w-[340px] md:max-w-[570px]" aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 aspect-square w-[87.7%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,light-dark(rgb(214_236_222/0.95),rgb(125_211_160/0.14)),transparent_70%)]" />
      <span className="absolute left-1/2 top-1/2 aspect-square w-[87.7%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line-strong" />

      <Art name="plate-eucalyptus" eager className="rise rise-1 absolute left-[3.5%] top-[18.3%] w-[56.1%]" />
      <Art name="plate-lavender" eager className="rise rise-2 absolute left-[26.3%] top-[5%] w-[66.7%]" />
      <Art name="plate-chamomile" eager className="rise rise-3 absolute left-[52.6%] top-[31.7%] w-[47.4%]" />

      <span className="absolute inset-x-0 bottom-[1%] h-px bg-[linear-gradient(90deg,transparent,var(--color-line-strong)_20%,var(--color-line-strong)_80%,transparent)]" />

      <div className="absolute right-[1.75%] top-[3.3%] grid aspect-square w-[21%] place-items-center rounded-full bg-surface-raised shadow-card">
        <svg viewBox="0 0 120 120" className="spin-slow h-[90%] w-[90%]">
          <defs>
            <path id="hero-seal-circle" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
          </defs>
          <text className="fill-brand font-mono" fontSize="9" letterSpacing="2.4">
            <textPath href="#hero-seal-circle">{SEAL_TEXT}</textPath>
          </text>
        </svg>
        <BranchGlyph className="absolute h-[30%] text-brand" />
      </div>
    </div>
  )
}
