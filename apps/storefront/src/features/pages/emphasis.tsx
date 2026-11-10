import type { ReactNode } from 'react'

/**
 * Headings mark their emphasised words with asterisks, e.g.
 * "Four quiet corners *of the garden.*" (redesign-spec §1 Typography: the
 * emphasised part is italic, weight 400). Plain text in, React nodes out —
 * config strings are never treated as HTML. An unmatched `*` stays literal.
 */
export function splitEmphasis(text: string): Array<{ text: string; em: boolean }> {
  const parts: Array<{ text: string; em: boolean }> = []
  const pattern = /\*([^*]+)\*/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), em: false })
    parts.push({ text: match[1]!, em: true })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), em: false })
  return parts
}

export function Emphasised({ text, emClassName = '' }: { text: string; emClassName?: string }): ReactNode {
  return splitEmphasis(text).map((part, i) =>
    part.em ? (
      <em key={i} className={`font-normal italic ${emClassName}`}>
        {part.text}
      </em>
    ) : (
      part.text
    ),
  )
}

/** Eyebrow + h2 used by every home section. */
export function SectionHeading({
  eyebrow,
  heading,
  className = '',
  emClassName,
}: {
  eyebrow?: string
  heading: string
  className?: string
  emClassName?: string
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {eyebrow && <span className="rise font-mono text-[11px] uppercase tracking-[0.14em] text-brand md:text-xs">{eyebrow}</span>}
      <h2 className="rise rise-1 font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-heading md:text-[52px] md:leading-[1.05]">
        <Emphasised text={heading} emClassName={emClassName} />
      </h2>
    </div>
  )
}
