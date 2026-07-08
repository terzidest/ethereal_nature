import { createProductMutation } from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ProductForm, serverErrorMessage } from '../../../features/products/components/ProductForm'
import { invalidateProductQueries } from '../../../features/products/queries'

export const Route = createFileRoute('/_authed/products/new')({
  component: NewProductPage,
})

function NewProductPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    ...createProductMutation({ throwOnError: true }),
    onSuccess: (product) => {
      void invalidateProductQueries(queryClient)
      void navigate({ to: '/products/$productId', params: { productId: product.id } })
    },
  })

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-6 py-8 lg:px-8">
      <Link to="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← All products
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-brand-900">New product</h1>
      <ProductForm
        submitLabel="Create product"
        isPending={mutation.isPending}
        serverError={mutation.isError ? serverErrorMessage(mutation.error) : null}
        onSubmit={(input) => mutation.mutate({ body: input })}
      />
    </main>
  )
}
