const BRANCH =
  'M40 116C44 90 52 60 74 22M44.5 93.1Q46 75.8 27.7 68.3Q27.8 88.1 44.5 93.1M44.5 93.1Q39 82.7 31.4 73.8M48.7 78.1Q65.6 82.5 76.1 65.7Q56.5 62.5 48.7 78.1M48.7 78.1Q59.9 74.5 70 68.4M54.4 62.1Q58 46.7 42.4 37.9Q40.1 55.7 54.4 62.1M54.4 62.1Q50.8 52.1 45 43.2M61.4 46Q74.3 51.5 84.4 39Q69.1 34.2 61.4 46M61.4 46Q70.7 44.3 79.3 40.6M74 22Q84.7 17.2 82.8 4Q71.2 10.6 74 22M74 22Q78.2 15.4 80.9 8'

/** The mark's branch on its own (no circle), e.g. inside the hero seal. Takes the text colour. */
export function BranchGlyph({ className = '', strokeWidth = 4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="26 12 66 110" className={className} aria-hidden="true">
      <path d={BRANCH} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Brand mark: a line-drawn branch in a soft circle (works down to 16px). */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" className="fill-brand-soft" />
      <svg x="9.5" y="5.5" width="13" height="21" viewBox="26 12 66 110">
        <path
          d={BRANCH}
          className="stroke-brand"
          fill="none"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </svg>
  )
}
