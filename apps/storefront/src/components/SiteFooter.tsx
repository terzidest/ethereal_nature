// App chrome: shared footer, including the API health indicator.
import { getHealthOptions } from '@ethereal-nature/api-client'
import { StatusPill } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LeafMark } from './LeafMark'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-sand-100/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2">
            <LeafMark className="h-6 w-6" />
            <span className="font-display text-lg font-semibold text-brand-900">Ethereal Nature</span>
          </span>
          <p className="text-sm leading-relaxed text-ink/60">
            Small-batch botanicals, oils, crystals, and teas — sourced with care, shipped with intention.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Shop">
          <span className="font-semibold text-ink">Shop</span>
          <Link to="/products" search={{ category: 'OILS' }} className="text-ink/60 hover:text-brand-700">
            Essential oils
          </Link>
          <Link to="/products" search={{ category: 'HERBS' }} className="text-ink/60 hover:text-brand-700">
            Herbs
          </Link>
          <Link to="/products" search={{ category: 'CRYSTALS' }} className="text-ink/60 hover:text-brand-700">
            Crystals
          </Link>
          <Link to="/products" search={{ category: 'TEAS' }} className="text-ink/60 hover:text-brand-700">
            Teas
          </Link>
        </nav>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Account">
          <span className="font-semibold text-ink">Account</span>
          <Link to="/account" className="text-ink/60 hover:text-brand-700">
            Your account
          </Link>
          <Link to="/cart" className="text-ink/60 hover:text-brand-700">
            Cart
          </Link>
          <Link to="/register" className="text-ink/60 hover:text-brand-700">
            Create account
          </Link>
        </nav>

        <div className="flex flex-col gap-3 text-sm">
          <span className="font-semibold text-ink">About this shop</span>
          <p className="text-ink/60">
            A demo storefront showcasing clean architecture. No real orders, no payments.
          </p>
          <ApiHealth />
        </div>
      </div>
      <div className="border-t border-brand-100/70 py-4 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Ethereal Nature — demo project
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
