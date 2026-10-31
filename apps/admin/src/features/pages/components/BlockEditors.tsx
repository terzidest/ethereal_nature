import type { ProductCategoryDto, ProductSortDto } from '@ethereal-nature/api-client'
import {
  BLOCKS,
  CATEGORIES,
  SORTS,
  type CategoryTilesProps,
  type HeroProps,
  type KnownBlockProps,
  type KnownBlockType,
  type ProductStripProps,
  type ValuePropsProps,
} from '../blocks'

const inputClass =
  'rounded border border-brand-100 bg-white px-3 py-2 text-base font-normal outline-none focus:border-brand-500'

const SORT_LABELS: Record<ProductSortDto, string> = {
  newest: 'Newest first',
  name: 'Name (A–Z)',
  'price-asc': 'Price (low → high)',
  'price-desc': 'Price (high → low)',
}

const CATEGORY_LABELS: Record<ProductCategoryDto, string> = {
  OILS: 'Essential oils',
  HERBS: 'Herbs',
  CRYSTALS: 'Crystals',
  TEAS: 'Teas',
}

interface EditorProps<T> {
  props: T
  onChange: (props: T) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink">
      {label}
      {children}
    </label>
  )
}

function HeroEditor({ props, onChange }: EditorProps<HeroProps>) {
  const set = (patch: Partial<HeroProps>) => onChange({ ...props, ...patch })
  return (
    <div className="flex flex-col gap-4">
      <Field label="Eyebrow">
        <input value={props.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Title">
        <input value={props.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Subtitle">
        <textarea
          rows={2}
          value={props.subtitle}
          onChange={(e) => set({ subtitle: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Primary button label">
          <input
            value={props.primaryCta.label}
            onChange={(e) => set({ primaryCta: { label: e.target.value } })}
            className={inputClass}
          />
        </Field>
        <Field label="Secondary button label">
          <input
            value={props.secondaryCta.label}
            onChange={(e) => set({ secondaryCta: { ...props.secondaryCta, label: e.target.value } })}
            className={inputClass}
          />
        </Field>
        <Field label="Secondary button sorts by">
          <select
            value={props.secondaryCta.sort ?? ''}
            onChange={(e) =>
              set({
                secondaryCta: {
                  label: props.secondaryCta.label,
                  ...(e.target.value === '' ? {} : { sort: e.target.value as ProductSortDto }),
                },
              })
            }
            className={inputClass}
          >
            <option value="">Default order</option>
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-xs text-ink/40">Both buttons link to the catalog; the artwork grid is fixed.</p>
    </div>
  )
}

function CategoryTilesEditor({ props, onChange }: EditorProps<CategoryTilesProps>) {
  const setTile = (index: number, patch: Partial<CategoryTilesProps['tiles'][number]>) =>
    onChange({
      ...props,
      tiles: props.tiles.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)),
    })
  return (
    <div className="flex flex-col gap-4">
      <Field label="Heading">
        <input
          value={props.heading}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="flex flex-col gap-3">
        {props.tiles.map((tile, index) => (
          <div key={index} className="grid gap-3 rounded-card border border-brand-100 p-3 sm:grid-cols-3">
            <Field label="Category">
              <select
                value={tile.category}
                onChange={(e) => setTile(index, { category: e.target.value as ProductCategoryDto })}
                className={inputClass}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label">
              <input value={tile.label} onChange={(e) => setTile(index, { label: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Blurb">
              <input value={tile.blurb} onChange={(e) => setTile(index, { blurb: e.target.value })} className={inputClass} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductStripEditor({ props, onChange }: EditorProps<ProductStripProps>) {
  const set = (patch: Partial<ProductStripProps>) => onChange({ ...props, ...patch })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Title">
        <input value={props.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Category">
        <select
          value={props.category ?? ''}
          // undefined is dropped by JSON serialization, so "" saves as no category
          onChange={(e) => set({ category: e.target.value === '' ? undefined : (e.target.value as ProductCategoryDto) })}
          className={inputClass}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sort">
        <select value={props.sort ?? 'newest'} onChange={(e) => set({ sort: e.target.value as ProductSortDto })} className={inputClass}>
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Products shown (1–12)">
        <input
          type="number"
          min={1}
          max={12}
          step={1}
          value={props.limit ?? 4}
          onChange={(e) => {
            const limit = Math.trunc(Number(e.target.value))
            set({ limit: Number.isInteger(limit) ? Math.min(12, Math.max(1, limit)) : 4 })
          }}
          className={inputClass}
        />
      </Field>
    </div>
  )
}

function ValuePropsEditor({ props, onChange }: EditorProps<ValuePropsProps>) {
  const setItem = (index: number, patch: Partial<ValuePropsProps['items'][number]>) =>
    onChange({ items: props.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  return (
    <div className="flex flex-col gap-3">
      {props.items.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-card border border-brand-100 p-3 sm:grid-cols-[1fr_2fr_auto]">
          <Field label="Title">
            <input value={item.title} onChange={(e) => setItem(index, { title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Blurb">
            <input value={item.blurb} onChange={(e) => setItem(index, { blurb: e.target.value })} className={inputClass} />
          </Field>
          <button
            type="button"
            onClick={() => onChange({ items: props.items.filter((_, i) => i !== index) })}
            className="self-end rounded px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={() => onChange({ items: [...props.items, { title: '', blurb: '' }] })}
          className="rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-900 hover:bg-brand-100"
        >
          + Add item
        </button>
      </div>
    </div>
  )
}

/** Dispatches to the right form for a known block type. */
export function BlockEditor({
  type,
  props,
  onChange,
}: {
  type: KnownBlockType
  props: KnownBlockProps[KnownBlockType]
  onChange: (props: unknown) => void
}) {
  switch (type) {
    case 'hero':
      return <HeroEditor props={props as HeroProps} onChange={onChange} />
    case 'categoryTiles':
      return <CategoryTilesEditor props={props as CategoryTilesProps} onChange={onChange} />
    case 'productStrip':
      return <ProductStripEditor props={props as ProductStripProps} onChange={onChange} />
    case 'valueProps':
      return <ValuePropsEditor props={props as ValuePropsProps} onChange={onChange} />
  }
}

export function blockLabel(type: string): string {
  return type in BLOCKS ? BLOCKS[type as KnownBlockType].label : type
}
