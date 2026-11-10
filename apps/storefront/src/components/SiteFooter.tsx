// App chrome: shared footer, including the API health indicator.
import { getHealthOptions } from '@ethereal-nature/api-client'
import { StatusPill } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Art, BrandMark } from '@ethereal-nature/ui'

const heading = 'pb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brand'
const link = 'py-2 text-ink-soft transition hover:text-heading md:py-0'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-sand-100 px-5 pb-7 pt-10 md:px-6 md:pb-10 md:pt-16">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 md:gap-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:gap-12">
          <div className="flex max-w-xs flex-col gap-3.5">
            <span className="flex items-center gap-3 font-display text-[22px] font-semibold text-heading md:text-2xl">
              <BrandMark className="h-8 w-8" />
              Ethereal Nature
            </span>
            <p className="text-sm leading-relaxed text-ink-soft">
              Small-batch essential oils, dried herbs, crystals and loose-leaf teas, sourced with care.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm md:flex md:gap-[72px]">
            <nav className="flex flex-col md:gap-3" aria-label="Shop">
              <span className={heading}>Shop</span>
              <Link to="/products" search={{ category: 'OILS' }} className={link}>
                Essential oils
              </Link>
              <Link to="/products" search={{ category: 'HERBS' }} className={link}>
                Herbs
              </Link>
              <Link to="/products" search={{ category: 'CRYSTALS' }} className={link}>
                Crystals
              </Link>
              <Link to="/products" search={{ category: 'TEAS' }} className={link}>
                Teas
              </Link>
            </nav>
            <nav className="flex flex-col md:gap-3" aria-label="Account">
              <span className={heading}>Account</span>
              <Link to="/login" className={link}>
                Sign in
              </Link>
              <Link to="/account" className={link}>
                Orders
              </Link>
              <Link to="/cart" className={link}>
                Cart
              </Link>
            </nav>
          </div>
        </div>

        {/* Eucalyptus plate tucked under the link columns (desktop Home board). */}
        <div className="relative hidden md:block" aria-hidden="true">
          <Art name="plate-eucalyptus" className="pointer-events-none absolute -top-[150px] right-6 w-[200px] opacity-80" />
        </div>

        <div
          className="overflow-hidden whitespace-nowrap font-display text-[62px] font-semibold leading-[0.85] tracking-[-0.04em] text-brand/[0.08] md:text-[168px]"
          aria-hidden="true"
        >
          Ethereal Nature
        </div>

        <div className="flex flex-col gap-3 text-[13px] text-ink-soft md:flex-row md:items-center md:justify-between">
          <span>© Ethereal Nature</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs">Demo store · mock payments only</span>
            <ApiHealth />
          </div>
        </div>
      </div>
    </footer>
  )
}

function ApiHealth() {
  const { data, isPending, isError } = useQuery({ ...getHealthOptions(), staleTime: 60_000 })
  const tone = isPending ? 'pending' : isError || data?.database !== 'up' ? 'error' : 'ok'
  return (
    <StatusPill tone={tone}>
      {isPending ? 'Checking API…' : isError ? 'API offline' : `API ${data.status} · db ${data.database}`}
    </StatusPill>
  )
}
