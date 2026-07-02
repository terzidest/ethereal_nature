import { getProductOptions, listProductsOptions } from '@ethereal-nature/api-client'
import { pageOf, sortOf, type CatalogSearch } from './search'

export const PAGE_SIZE = 12

export function catalogListQuery(search: CatalogSearch) {
  return listProductsOptions({
    query: {
      page: pageOf(search),
      pageSize: PAGE_SIZE,
      category: search.category,
      q: search.q,
      sort: sortOf(search),
    },
  })
}

export function productDetailQuery(productId: string) {
  return getProductOptions({ path: { id: productId } })
}
