import type { ProductImageRequest } from '@ethereal-nature/api-client'
import { useState } from 'react'

/** Matches the server's limit; the server stays the authority. */
export const MAX_IMAGES = 8

export interface GalleryRow {
  /** Stable React key; never sent to the API. */
  key: number
  url: string
  label: string
}

let nextKey = 0
export const galleryRow = (url = '', label = ''): GalleryRow => ({ key: nextKey++, url, label })

/** Rows → request payload: empty rows are dropped, blank labels omitted. */
export function toImageRequests(rows: readonly GalleryRow[]): ProductImageRequest[] {
  return rows
    .filter((row) => row.url.trim() !== '')
    .map((row) => (row.label.trim() === '' ? { url: row.url.trim() } : { url: row.url.trim(), label: row.label.trim() }))
}

const inputClass =
  'min-w-0 rounded border border-brand-100 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-brand-500'
const iconButton =
  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/60 hover:bg-brand-50 hover:text-brand-900 disabled:opacity-30 disabled:hover:bg-transparent'

/**
 * Ordered list of photo URLs. The first row is the main photo (cards, cart,
 * link previews); the rest show as extra shots on the product page.
 */
export function GalleryEditor({
  rows,
  onChange,
}: {
  rows: GalleryRow[]
  onChange: (rows: GalleryRow[]) => void
}) {
  const update = (key: number, patch: Partial<GalleryRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  const move = (index: number, by: -1 | 1) => {
    const next = [...rows]
    const [row] = next.splice(index, 1)
    next.splice(index + by, 0, row!)
    onChange(next)
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-1 text-sm font-medium text-ink">
        Photos <span className="font-normal text-ink/40">(paste image URLs — the first one is the main photo)</span>
      </legend>

      {rows.length === 0 && (
        <p className="rounded border border-dashed border-brand-100 px-3 py-4 text-sm text-ink/50">
          No photos — the shop shows generated artwork instead.
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <li key={row.key} className="flex items-start gap-3 rounded-card border border-brand-100 bg-white p-2">
            <Thumb url={row.url} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-ink/50">
                <span className="font-semibold text-ink/70">#{index + 1}</span>
                {index === 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-900">Main photo</span>
                )}
              </div>
              <input
                type="url"
                aria-label={`Photo ${index + 1} URL`}
                placeholder="https://img.terzidest.com/products/…"
                value={row.url}
                onChange={(event) => update(row.key, { url: event.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Photo ${index + 1} label`}
                placeholder="Label, e.g. In hand, for scale (optional)"
                maxLength={100}
                value={row.label}
                onChange={(event) => update(row.key, { label: event.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Move photo ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className={iconButton}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move photo ${index + 1} down`}
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
                className={iconButton}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                className={`${iconButton} hover:text-red-600`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div>
        <button
          type="button"
          disabled={rows.length >= MAX_IMAGES}
          onClick={() => onChange([...rows, galleryRow()])}
          className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-100 disabled:opacity-50"
        >
          + Add photo
        </button>
        {rows.length >= MAX_IMAGES && (
          <span className="ml-3 text-sm text-ink/50">Up to {MAX_IMAGES} photos.</span>
        )}
      </div>
    </fieldset>
  )
}

function Thumb({ url }: { url: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const trimmed = url.trim()
  const failed = trimmed !== '' && failedUrl === trimmed

  return (
    <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-card border border-brand-100 bg-sand-100">
      {trimmed !== '' && !failed && (
        <img src={trimmed} alt="" onError={() => setFailedUrl(trimmed)} className="h-full w-full object-cover" />
      )}
      {failed && (
        <span className="absolute inset-0 grid place-items-center p-1 text-center text-[10px] leading-tight text-red-600">
          Can't load
        </span>
      )}
    </span>
  )
}
