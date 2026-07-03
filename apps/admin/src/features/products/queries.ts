import { listAdminProductsOptions } from '@ethereal-nature/api-client'
import type { QueryClient } from '@tanstack/react-query'
import { pageOf, pageSizeOf, sortOf, type ProductsTableSearch } from './search'

/** Back-office listing — includes archived products. */
export function productsTableQuery(search: ProductsTableSearch) {
  return listAdminProductsOptions({
    query: {
      page: pageOf(search),
      pageSize: pageSizeOf(search),
      category: search.category,
      q: search.q,
      sort: sortOf(search),
    },
  })
}

/** After any product write, every product-shaped query is stale. */
export function invalidateProductQueries(queryClient: QueryClient) {
  const staleIds = new Set(['listProducts', 'listAdminProducts', 'getProduct'])
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const id = (query.queryKey[0] as { _id?: string } | undefined)?._id
      return id !== undefined && staleIds.has(id)
    },
  })
}
