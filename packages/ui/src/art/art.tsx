import { useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * Botanical illustrations from the brand board (docs/design/redesign-spec.md §3).
 * Each piece is its own module (a few KB to ~260KB of path data), loaded
 * only when it scrolls near the viewport, then drawn inline so outlines
 * follow the theme (`--color-art-ink`) and leaves can unfurl. Decorative
 * by definition: always aria-hidden.
 */
const pieces = {
  'plate-lavender': () => import('./generated/plate-lavender'),
  'plate-eucalyptus': () => import('./generated/plate-eucalyptus'),
  'plate-chamomile': () => import('./generated/plate-chamomile'),
  'plate-sage': () => import('./generated/plate-sage'),
  'plate-olive': () => import('./generated/plate-olive'),
  'plate-ginkgo': () => import('./generated/plate-ginkgo'),
  bouquet: () => import('./generated/bouquet'),
  parcel: () => import('./generated/parcel'),
  'icon-oils': () => import('./generated/icon-oils'),
  'icon-herbs': () => import('./generated/icon-herbs'),
  'icon-crystals': () => import('./generated/icon-crystals'),
  'icon-teas': () => import('./generated/icon-teas'),
}

export type ArtName = keyof typeof pieces

/** Aspect of each viewBox, so the reserved box never shifts the layout. */
const ASPECT: Record<ArtName, string> = {
  'plate-lavender': '200 / 260',
  'plate-eucalyptus': '200 / 260',
  'plate-chamomile': '200 / 260',
  'plate-sage': '200 / 260',
  'plate-olive': '200 / 260',
  'plate-ginkgo': '200 / 260',
  bouquet: '600 / 650',
  parcel: '200 / 260',
  'icon-oils': '1 / 1',
  'icon-herbs': '1 / 1',
  'icon-crystals': '1 / 1',
  'icon-teas': '1 / 1',
}

interface Loaded {
  viewBox: string
  markup: string
}

export function Art({
  name,
  className = '',
  style,
  eager = false,
}: {
  name: ArtName
  className?: string
  style?: CSSProperties
  /** Load right after hydration instead of waiting to scroll into view. */
  eager?: boolean
}) {
  const box = useRef<HTMLSpanElement>(null)
  const [art, setArt] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      void pieces[name]().then((piece) => {
        if (!cancelled) setArt({ viewBox: piece.viewBox, markup: piece.markup })
      })
    const el = box.current
    if (eager || !el || !('IntersectionObserver' in window)) {
      load()
      return () => {
        cancelled = true
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect()
          load()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [name, eager])

  return (
    <span
      ref={box}
      aria-hidden="true"
      className={`art block ${className}`}
      style={{ aspectRatio: ASPECT[name], ...style }}
    >
      {art && (
        <svg
          viewBox={art.viewBox}
          className="block h-full w-full overflow-visible"
          focusable="false"
          // Static, first-party path data generated from the design canvas.
          dangerouslySetInnerHTML={{ __html: art.markup }}
        />
      )}
    </span>
  )
}
