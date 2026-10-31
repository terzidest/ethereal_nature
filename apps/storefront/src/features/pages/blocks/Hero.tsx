import { ProductArt } from '@ethereal-nature/ui'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { SORTS } from '../../catalog/search'

export const heroSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  primaryCta: z.object({ label: z.string() }),
  secondaryCta: z.object({ label: z.string(), sort: z.enum(SORTS).optional() }),
})

export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta }: z.output<typeof heroSchema>) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-surface to-sand-100">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 px-6 py-16 md:flex-row md:py-24">
        <div className="flex max-w-xl flex-col items-start gap-6">
          <span className="rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-800">
            {eyebrow}
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-brand-900 sm:text-5xl">
            {title}
          </h1>
          <p className="text-lg leading-relaxed text-ink/70">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              {primaryCta.label}
            </Link>
            <Link
              to="/products"
              search={secondaryCta.sort ? { sort: secondaryCta.sort } : {}}
              className="rounded-full bg-surface-raised px-8 py-3 text-sm font-semibold text-brand-900 shadow-card transition hover:bg-brand-50"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3 md:ml-auto" aria-hidden="true">
          <div className="translate-y-4 overflow-hidden rounded-tile shadow-lifted">
            <ProductArt category="OILS" seed="hero-oils" className="aspect-square w-full" />
          </div>
          <div className="overflow-hidden rounded-tile shadow-card">
            <ProductArt category="CRYSTALS" seed="hero-crystals" className="aspect-square w-full" />
          </div>
          <div className="translate-y-4 overflow-hidden rounded-tile shadow-card">
            <ProductArt category="TEAS" seed="hero-teas" className="aspect-square w-full" />
          </div>
          <div className="overflow-hidden rounded-tile shadow-lifted">
            <ProductArt category="HERBS" seed="hero-herbs" className="aspect-square w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
