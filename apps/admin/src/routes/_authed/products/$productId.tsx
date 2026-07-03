import {
  getProductOptions,
  setProductArchivedMutation,
  updateProductMutation,
} from '@ethereal-nature/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ProductForm, serverErrorMessage } from '../../../features/products/components/ProductForm'
import { invalidateProductQueries } from '../../../features/products/queries'

export const Route = createFileRoute('/_authed/products/$productId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getProductOptions({ path: { id: params.productId } })),
  component: EditProductPage,
})

function EditProductPage() {
  const { productId } = Route.useParams()
  const queryClient = useQueryClient()
  const product = useQuery(getProductOptions({ path: { id: productId } }))

  const update = useMutation({
    ...updateProductMutation({ throwOnError: true }),
    onSuccess: () => void invalidateProductQueries(queryClient),
  })
  const archive = useMutation({
    ...setProductArchivedMutation({ throwOnError: true }),
    onSuccess: () => void invalidateProductQueries(queryClient),
  })

  if (product.isPending) return <main className="mx-auto max-w-4xl px-6 py-10 text-ink/50">Loading…</main>
  if (product.isError || !product.data) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-6 py-10">
        <p className="text-red-600">Product not found.</p>
        <Link to="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          ← All products
        </Link>
      </main>
    )
  }

  const data = product.data

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <Link to="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← All products
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">{data.name}</h1>
        {data.archived && (
          <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600">
            Archived
          </span>
        )}
        <button
          type="button"
          disabled={archive.isPending}
          onClick={() =>
            archive.mutate({ path: { id: data.id }, body: { archived: !data.archived } })
          }
          className="ml-auto rounded-full bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-100 disabled:opacity-50"
        >
          {archive.isPending ? 'Working…' : data.archived ? 'Restore product' : 'Archive product'}
        </button>
      </header>

      <p className="text-sm text-ink/50">
        Slug: <code>{data.slug}</code> (fixed at creation — URLs stay stable through renames).
        Price and stock changes never affect already-placed orders.
      </p>

      {update.isSuccess && <p className="text-sm text-brand-700">Saved.</p>}

      <ProductForm
        initial={data}
        submitLabel="Save changes"
        isPending={update.isPending}
        serverError={update.isError ? serverErrorMessage(update.error) : null}
        onSubmit={(input) => update.mutate({ path: { id: data.id }, body: input })}
      />
    </main>
  )
}
