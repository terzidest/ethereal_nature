import type { ProductInputRequest, ProductResponse } from '@ethereal-nature/api-client'
import { useState } from 'react'
import { categoryLabel } from '../derive'
import { CATEGORIES } from '../search'

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
}: {
  initial?: ProductResponse
  submitLabel: string
  isPending: boolean
  /** Domain validation message from the backend (StatusPages VALIDATION 400). */
  serverError: string | null
  onSubmit: (input: ProductInputRequest) => void
}) {
  const [priceError, setPriceError] = useState(false)

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
          imageUrl: form.get('imageUrl')?.toString().trim() || null,
        })
      }}
    >
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
        Image URL <span className="font-normal text-ink/40">(optional)</span>
        <input name="imageUrl" type="url" defaultValue={initial?.imageUrl ?? ''} className={inputClass} />
      </label>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export function serverErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Something went wrong — please try again.'
}
