import { getPageOptions, updatePageMutation } from '@ethereal-nature/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useIsViewer } from '../../../features/auth/viewer'
import { BLOCKS, isKnownBlockType, KNOWN_BLOCK_TYPES, type KnownBlockType } from '../../../features/pages/blocks'
import { BlockEditor, blockLabel } from '../../../features/pages/components/BlockEditors'
import {
  appendEntry,
  entriesOf,
  moveEntry,
  removeEntry,
  updateEntryProps,
  type BlockEntry,
} from '../../../features/pages/config'
import { invalidatePageQueries, storefrontPageUrl } from '../../../features/pages/queries'
import { serverErrorMessage } from '../../../features/products/components/ProductForm'

export const Route = createFileRoute('/_authed/pages/$slug')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getPageOptions({ path: { slug: params.slug } })),
  component: EditPagePage,
})

function EditPagePage() {
  const { slug } = Route.useParams()
  const isViewer = useIsViewer()
  const queryClient = useQueryClient()
  const page = useQuery(getPageOptions({ path: { slug } }))

  // Server truth stays in React Query; the in-progress edit is a local draft.
  // null = pristine (render whatever the server has).
  const [draft, setDraft] = useState<BlockEntry[] | null>(null)
  const [addType, setAddType] = useState<KnownBlockType>('productStrip')

  const save = useMutation({
    ...updatePageMutation({ throwOnError: true }),
    onSuccess: async () => {
      await invalidatePageQueries(queryClient)
      setDraft(null)
    },
  })

  if (page.isPending) return <main className="max-w-4xl px-6 py-8 text-ink/50 lg:px-8">Loading…</main>
  if (page.isError || !page.data) {
    return (
      <main className="flex max-w-4xl flex-col items-start gap-4 px-6 py-8 lg:px-8">
        <p className="text-red-600">Page not found.</p>
        <Link to="/pages" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          ← All pages
        </Link>
      </main>
    )
  }

  const entries = draft ?? entriesOf(page.data.config)
  const dirty = draft !== null
  const edit = (next: BlockEntry[]) => {
    setDraft(next)
    save.reset()
  }

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-6 py-8 lg:px-8">
      <Link to="/pages" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← All pages
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">
          Page: /{slug === 'home' ? '' : slug}
        </h1>
        <a
          href={storefrontPageUrl(slug)}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          View on site ↗
        </a>
        {!isViewer && (
          <div className="ml-auto flex items-center gap-3">
            {dirty && (
              <button
                type="button"
                onClick={() => {
                  setDraft(null)
                  save.reset()
                }}
                className="text-sm font-medium text-ink/60 hover:text-ink"
              >
                Discard changes
              </button>
            )}
            <button
              type="button"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate({ path: { slug }, body: { config: entries } })}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {save.isPending ? 'Publishing…' : 'Publish changes'}
            </button>
          </div>
        )}
      </header>

      <p className="text-sm text-ink/50">
        Sections render top to bottom on the storefront. Saving publishes immediately — there is no draft
        state on the live site.
      </p>

      {save.isSuccess && !dirty && (
        <p className="text-sm text-brand-700">
          Published.{' '}
          <a href={storefrontPageUrl(slug)} target="_blank" rel="noreferrer" className="font-medium underline">
            View on site ↗
          </a>
        </p>
      )}
      {save.isError && <p className="text-sm text-red-600">{serverErrorMessage(save.error)}</p>}

      <fieldset disabled={isViewer} className="flex flex-col gap-4">
        {entries.map((entry, index) => (
          <section key={`${index}-${entry.type}`} className="rounded-card border border-brand-100 bg-white">
            <header className="flex items-center gap-3 border-b border-brand-100 px-5 py-3">
              <span className="font-semibold text-brand-900">{blockLabel(entry.type)}</span>
              <span className="truncate text-sm text-ink/50">
                {isKnownBlockType(entry.type) ? summarize(entry) : 'Unknown block — preserved as-is'}
              </span>
              {!isViewer && (
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  <MoveButton label="Move up" arrow="↑" disabled={index === 0} onClick={() => edit(moveEntry(entries, index, -1))} />
                  <MoveButton
                    label="Move down"
                    arrow="↓"
                    disabled={index === entries.length - 1}
                    onClick={() => edit(moveEntry(entries, index, 1))}
                  />
                  <button
                    type="button"
                    onClick={() => edit(removeEntry(entries, index))}
                    className="rounded px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </span>
              )}
            </header>
            {isKnownBlockType(entry.type) ? (
              <details className="group px-5 py-3" open={isViewer}>
                <summary className="cursor-pointer select-none text-sm font-medium text-brand-700 hover:text-brand-900">
                  <span className="group-open:hidden">Edit section</span>
                  <span className="hidden group-open:inline">Collapse</span>
                </summary>
                <div className="pt-4">
                  <BlockEditor
                    type={entry.type}
                    props={BLOCKS[entry.type].normalize(entry.props)}
                    onChange={(props) => edit(updateEntryProps(entries, index, props))}
                  />
                </div>
              </details>
            ) : (
              // Forward compat: a block this admin build doesn't know (added by
              // a newer storefront) is shown raw and kept verbatim on save.
              <pre className="overflow-x-auto px-5 py-3 text-xs text-ink/60">
                {JSON.stringify(entry.props ?? {}, null, 2)}
              </pre>
            )}
          </section>
        ))}
        {entries.length === 0 && (
          <p className="rounded-card border border-dashed border-brand-200 px-5 py-8 text-center text-sm text-ink/50">
            No sections — the page renders empty. Add a section below.
          </p>
        )}
      </fieldset>

      {!isViewer && (
        <div className="flex items-center gap-3">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as KnownBlockType)}
            className="rounded border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {KNOWN_BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {BLOCKS[type].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => edit(appendEntry(entries, { type: addType, props: BLOCKS[addType].defaults }))}
            className="rounded-full bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-100"
          >
            + Add section
          </button>
        </div>
      )}
    </main>
  )
}

function summarize(entry: BlockEntry): string {
  if (!isKnownBlockType(entry.type)) return entry.type
  const block = BLOCKS[entry.type]
  return block.summary(block.normalize(entry.props) as never)
}

function MoveButton({
  label,
  arrow,
  disabled,
  onClick,
}: {
  label: string
  arrow: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded px-2 py-1 text-sm font-medium text-ink/70 hover:bg-brand-50 disabled:opacity-30"
    >
      {arrow}
    </button>
  )
}
