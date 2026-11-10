/** Brand mark: a two-tone leaf in a soft circle. */
export function LeafMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" className="fill-brand-soft" />
      <path
        d="M22.5 8.5c-7.5 1-11.6 5.2-12.9 13.9 8.7-1.3 12.9-5.4 13.9-12.9l-1-1z"
        className="fill-brand"
      />
      <path d="M10.5 21.5c3.4-4.3 6.9-7.8 11-10.5" className="stroke-surface" strokeWidth="1.2" fill="none" />
    </svg>
  )
}
