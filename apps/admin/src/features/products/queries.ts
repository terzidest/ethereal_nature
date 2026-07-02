import { listProductsOptions } from '@ethereal-nature/api-client'
import { pageOf, pageSizeOf, sortOf, type ProductsTableSearch } from './search'

export function productsTableQuery(search: ProductsTableSearch) {
  return listProductsOptions({
    query: {
      page: pageOf(search),
      pageSize: pageSizeOf(search),
      category: search.category,
      q: search.q,
      sort: sortOf(search),
    },
  })
}
