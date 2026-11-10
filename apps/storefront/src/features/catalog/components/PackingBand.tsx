import { SITE_PHOTOS } from '../copy'

/** "Packed by hand" — one shared photo on every product page; copy stays category-neutral (Product board). */
export function PackingBand() {
  return (
    <section className="mx-auto mt-8 w-full max-w-[1240px] px-5 md:mt-[120px] md:px-6">
      <div className="flex flex-col overflow-hidden rounded-[28px] border border-line bg-sand-100 md:grid md:min-h-[480px] md:grid-cols-[45fr_55fr] md:rounded-[36px]">
        <div className="order-2 flex flex-col justify-center gap-3 px-[22px] pb-[26px] pt-6 md:order-1 md:gap-5 md:p-16">
          <span className="rise font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">Packed by hand</span>
          <h2 className="rise rise-1 font-display text-[30px] font-normal italic leading-[1.08] tracking-[-0.02em] text-heading md:text-5xl md:leading-[1.06]">
            Packed by hand, one order at a time.
          </h2>
          <p className="rise rise-2 max-w-[400px] text-[15px] leading-relaxed text-ink-soft md:text-base">
            Every order leaves in a recycled kraft box, with a card naming what&apos;s inside.
          </p>
        </div>
        <div className="group relative order-1 aspect-[3/2] overflow-hidden md:order-2 md:aspect-auto md:min-h-[320px]">
          <img
            src={SITE_PHOTOS.packingBand}
            alt="Ethereal Nature teas in kraft pouches, a linen pouch, crystals and an open gift box, on a sunlit wooden table"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-grow)] group-hover:scale-105 dark:brightness-90"
          />
        </div>
      </div>
    </section>
  )
}
