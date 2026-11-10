import type { ProductInputRequest, ProductResponse } from '@ethereal-nature/api-client'
import { useState } from 'react'
import { categoryLabel } from '../derive'
import { CATEGORIES } from '../search'
import { GalleryEditor, galleryRow, toImageRequests, type GalleryRow } from './GalleryEditor'

/**
 * Price is entered in euros and converted to minor units at the edge —
 * the API only ever speaks integer cents.
 */
function eurosToMinor(input: string): number | null {
  const normalized = input.replace(',', '.').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Math.round(parseFloat(normalized) * 100)
}

const inputClass =
  'rounded border border-brand-100 bg-white px-3 py-2 text-base font-normal outline-none focus:border-brand-500'

export function ProductForm({
  initial,
  submitLabel,
  isPending,
  serverError,
  onSubmit,
  readOnly = false,
}: {
  initial?: ProductResponse
  submitLabel: string
  isPending: boolean
  /** Domain validation message from the backend (StatusPages VALIDATION 400). */
  serverError: string | null
  onSubmit: (input: ProductInputRequest) => void
  /** Demo-viewer mode: fields visible but inert, submit hidden. */
  readOnly?: boolean
}) {
  const [priceError, setPriceError] = useState(false)
  // Form draft: local component state (admin CLAUDE.md state table).
  const [gallery, setGallery] = useState<GalleryRow[]>(() =>
    (initial?.images ?? []).map((image) => galleryRow(image.url, image.label ?? '')),
  )
  const text = (form: FormData, field: string) => form.get(field)?.toString().trim() || null

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const priceMinor = eurosToMinor(form.get('price')?.toString() ?? '')
        if (priceMinor === null) {
          setPriceError(true)
          return
        }
        setPriceError(false)
        onSubmit({
          name: form.get('name')?.toString().trim() ?? '',
          description: form.get('description')?.toString().trim() ?? '',
          priceMinor,
          currency: 'EUR',
          stock: Math.max(0, Math.trunc(Number(form.get('stock')) || 0)),
          category: (form.get('category')?.toString() ?? 'HERBS') as ProductInputRequest['category'],
          summary: text(form, 'summary'),
          origin: text(form, 'origin'),
          size: text(form, 'size'),
          weight: text(form, 'weight'),
          images: toImageRequests(gallery),
        })
      }}
    >
      <fieldset disabled={readOnly} className="contents">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Name
        <input name="name" required maxLength={200} defaultValue={initial?.name} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Description
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={initial?.description}
          className={inputClass}
        />
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-ink">
          Price (EUR)
          <input
            name="price"
            required
            inputMode="decimal"
            placeholder="14.50"
            defaultValue={initial ? (initial.priceMinor / 100).toFixed(2) : ''}
            className={inputClass}
          />
          {priceError && <span className="font-normal text-red-600">Enter a price like 14.50</span>}
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-ink">
          Stock
          <input
            name="stock"
            required
            type="number"
            min={0}
            step={1}
            defaultValue={initial?.stock ?? 0}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Category
        <select name="category" defaultValue={initial?.category ?? 'HERBS'} className={inputClass}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Summary <span className="font-normal text-ink/40">(optional — one line under the price)</span>
        <input name="summary" maxLength={300} defaultValue={initial?.summary ?? ''} className={inputClass} />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Origin
          <input name="origin" maxLength={100} placeholder="Brazil" defaultValue={initial?.origin ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Size
          <input name="size" maxLength={100} placeholder="Roughly fist-sized" defaultValue={initial?.size ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Weight
          <input name="weight" maxLength={100} placeholder="250 g" defaultValue={initial?.weight ?? ''} className={inputClass} />
        </label>
      </div>

      <GalleryEditor rows={gallery} onChange={setGallery} />

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      {!readOnly && (
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : submitLabel}
          </button>
        </div>
      )}
      </fieldset>
    </form>
  )
}

export function serverErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Something went wrong — please try again.'
}
