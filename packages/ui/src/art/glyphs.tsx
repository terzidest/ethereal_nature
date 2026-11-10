import type { ArtCategory } from '../product-art'

/** Simple line glyphs for small sizes (below 32px), e.g. catalog chips. */
const GLYPHS: Record<ArtCategory | 'ALL', string> = {
  ALL: 'M12 12h16v16H12zM36 12h16v16H36zM12 36h16v16H12zM36 36h16v16H36z',
  OILS: 'M32 12C32 12 23 25 23 31.5a9 9 0 0 0 18 0C41 25 32 12 32 12ZM14 52h36',
  HERBS:
    'M32 56C31 46 33 34 37 18M32.1 43.6Q31 33.6 19.8 31.9Q22.1 43.1 32.1 43.6M32.1 43.6Q27.8 38.5 22.5 34.5M33.2 35.4Q42 37.5 46.4 28.3Q36.3 26.9 33.2 35.4M33.2 35.4Q38.7 33.3 43.5 29.9M37 18Q42.6 14.3 39.7 7.3Q33.8 12.1 37 18M37 18Q38.6 14 39.1 9.7',
  CRYSTALS: 'M25 54V30l7-13 7 13v24ZM14 54V39l5-8 6 8M39 54V36l6-9 6 9v18',
  TEAS: 'M15 30h30v6a15 15 0 0 1-30 0ZM45 33h3.5a5 5 0 0 1 0 10H44M30 24c-3-4 3-6 0-10',
}

export function CategoryGlyph({ category, className = 'h-4 w-4' }: { category: ArtCategory | 'ALL'; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`fill-none stroke-current ${className}`}
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={GLYPHS[category]} />
    </svg>
  )
}
