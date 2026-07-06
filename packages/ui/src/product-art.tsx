/**
 * Branded per-category product artwork. Deterministic: the same
 * product (slug) always renders the same variant, on the server and the
 * client, so SSR output is stable. When a product has a real imageUrl the
 * consumer should prefer it and use this as the fallback.
 */
import type { ReactNode } from 'react'

export type ArtCategory = 'OILS' | 'HERBS' | 'CRYSTALS' | 'TEAS'

interface Palette {
  wash: string
  washEdge: string
  primary: string
  secondary: string
  accent: string
}

const palettes: Record<ArtCategory, Palette[]> = {
  OILS: [
    { wash: '#f7ecd8', washEdge: '#f1dfc0', primary: '#c98a2d', secondary: '#8a5a1a', accent: '#f3c46a' },
    { wash: '#f5e9e0', washEdge: '#ecd8c8', primary: '#b0642f', secondary: '#7c421d', accent: '#e8a25e' },
    { wash: '#eef0dd', washEdge: '#e0e4c4', primary: '#8a8b2d', secondary: '#5c5e1a', accent: '#c9cb6a' },
  ],
  HERBS: [
    { wash: '#e7f0e2', washEdge: '#d5e5cc', primary: '#4d7c43', secondary: '#2f5429', accent: '#8fbc7f' },
    { wash: '#e4efe9', washEdge: '#cfe3d8', primary: '#3e7d5f', secondary: '#26553f', accent: '#7dbd9c' },
    { wash: '#eef2da', washEdge: '#e0e7c0', primary: '#6b8c2f', secondary: '#47611c', accent: '#a9c96a' },
  ],
  CRYSTALS: [
    { wash: '#ece7f2', washEdge: '#ddd4e9', primary: '#7c5fa8', secondary: '#54407a', accent: '#b39dd4' },
    { wash: '#e4edf3', washEdge: '#cfdfe9', primary: '#4a7d99', secondary: '#2f556b', accent: '#8ab8cf' },
    { wash: '#f3e7ec', washEdge: '#e9d3dd', primary: '#a85f7f', secondary: '#7a4059', accent: '#d49db6' },
  ],
  TEAS: [
    { wash: '#f2ece2', washEdge: '#e7dcc8', primary: '#8a6a3c', secondary: '#5e4626', accent: '#c4a068' },
    { wash: '#ece2d8', washEdge: '#dfcebc', primary: '#9c5a3c', secondary: '#6d3c26', accent: '#d19270' },
    { wash: '#e9ede4', washEdge: '#d8e0cd', primary: '#5f7c4a', secondary: '#405430', accent: '#9bbc82' },
  ],
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function Oils({ p, uid }: { p: Palette; uid: string }) {
  return (
    <>
      {/* dropper bottle */}
      <rect x="82" y="74" width="36" height="72" rx="8" fill={p.primary} />
      <rect x="82" y="74" width="36" height="72" rx="8" fill={`url(#shine-${uid})`} />
      <rect x="88" y="96" width="24" height="34" rx="3" fill={p.accent} opacity="0.55" />
      <rect x="92" y="58" width="16" height="18" rx="3" fill={p.secondary} />
      <rect x="96" y="46" width="8" height="14" rx="4" fill={p.secondary} />
      {/* falling drop */}
      <path d="M141 84c0 5-4 9-8 9s-8-4-8-9c0-6 8-16 8-16s8 10 8 16z" fill={p.accent} />
      {/* leaf flourish */}
      <path d="M56 132c14-2 22-12 24-26-14 2-22 12-24 26z" fill={p.secondary} opacity="0.7" />
    </>
  )
}

function Herbs({ p }: { p: Palette }) {
  return (
    <>
      {/* stem */}
      <path d="M100 150c-2-34 2-62 6-84" stroke={p.secondary} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* leaves */}
      <path d="M104 76c-16 2-26 12-28 28 16-2 26-12 28-28z" fill={p.primary} />
      <path d="M105 96c16 2 26 12 28 28-16-2-26-12-28-28z" fill={p.accent} />
      <path d="M102 112c-15 2-24 11-26 26 15-2 24-11 26-26z" fill={p.primary} />
      <path d="M103 128c14 2 22 10 24 24-14-2-22-10-24-24z" fill={p.secondary} />
      {/* bud */}
      <circle cx="107" cy="62" r="7" fill={p.secondary} />
    </>
  )
}

function Crystals({ p }: { p: Palette }) {
  return (
    <>
      <path d="M78 148V96l14-22 12 24v50z" fill={p.primary} />
      <path d="M92 74l-6 26 12 0z" fill="#ffffff" opacity="0.28" />
      <path d="M106 148v-42l12-20 10 22v40z" fill={p.accent} />
      <path d="M118 86l-5 22 10 0z" fill="#ffffff" opacity="0.3" />
      <path d="M62 148v-30l9-14 8 16v28z" fill={p.secondary} />
      <rect x="54" y="146" width="94" height="6" rx="3" fill={p.secondary} opacity="0.5" />
    </>
  )
}

function Teas({ p }: { p: Palette }) {
  return (
    <>
      {/* steam */}
      <path d="M88 60c-3 8 3 10 0 18M104 54c-3 8 3 10 0 18M120 60c-3 8 3 10 0 18"
        stroke={p.secondary} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* cup */}
      <path d="M66 92h76v18c0 22-17 38-38 38s-38-16-38-38z" fill={p.primary} />
      <path d="M66 92h76v10H66z" fill="#ffffff" opacity="0.22" />
      <path d="M142 98h10c8 0 12 6 12 12s-4 12-12 12h-12" stroke={p.secondary} strokeWidth="5" fill="none" />
      {/* saucer */}
      <ellipse cx="104" cy="150" rx="48" ry="6" fill={p.secondary} opacity="0.45" />
      {/* floating leaf */}
      <path d="M96 104c8-1 13-6 14-14-8 1-13 6-14 14z" fill={p.accent} />
    </>
  )
}

const motifs: Record<ArtCategory, (props: { p: Palette; uid: string }) => ReactNode> = {
  OILS: Oils,
  HERBS: Herbs,
  CRYSTALS: Crystals,
  TEAS: Teas,
}

export function ProductArt({
  category,
  seed,
  className = '',
}: {
  category: ArtCategory
  /** Usually the product slug — keeps the variant stable per product. */
  seed: string
  className?: string
}) {
  const options = palettes[category]
  const p = options[hashString(seed) % options.length] ?? options[0]!
  const Motif = motifs[category]
  // SVG url(#…) references are document-global; namespace per instance so
  // many artworks can share a page (and SSR output stays deterministic).
  const uid = `${category.toLowerCase()}-${hashString(seed).toString(36)}`

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`wash-${uid}`} cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor={p.wash} />
          <stop offset="100%" stopColor={p.washEdge} />
        </radialGradient>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#wash-${uid})`} />
      <circle cx="100" cy="108" r="64" fill="#ffffff" opacity="0.28" />
      <Motif p={p} uid={uid} />
    </svg>
  )
}

/** Prefers a real product photo, falls back to branded artwork. */
export function ProductImage({
  imageUrl,
  name,
  category,
  seed,
  className = '',
}: {
  imageUrl: string | null | undefined
  name: string
  category: ArtCategory
  seed: string
  className?: string
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} loading="lazy" className={`object-cover ${className}`} />
  }
  return <ProductArt category={category} seed={seed} className={className} />
}
