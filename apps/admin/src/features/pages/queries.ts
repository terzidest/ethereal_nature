import type { QueryClient } from '@tanstack/react-query'

/** After a page write, both the editor's page and the pages list are stale. */
export function invalidatePageQueries(queryClient: QueryClient) {
  const staleIds = new Set(['getPage', 'listPages'])
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const id = (query.queryKey[0] as { _id?: string } | undefined)?._id
      return id !== undefined && staleIds.has(id)
    },
  })
}

/** Where a page slug lives on the public storefront. */
export function storefrontPageUrl(slug: string): string {
  const base = (import.meta.env.VITE_STOREFRONT_URL as string | undefined) ?? 'http://localhost:3000'
  return slug === 'home' ? base : `${base}/${slug}`
}
