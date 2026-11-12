import { getPageOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Renderer } from 'blockprint'
import { productStripSchema } from '@ethereal-nature/blocks-contract'
import { categoryCountsQuery } from '../features/catalog/queries'
import { productStripQuery } from '../features/pages/blocks/ProductStrip'
import { homeRegistry } from '../features/pages/registry'

// Built lazily: hey-api captures the client baseUrl into the query key at
// creation time, and route modules load before configureApiClient() runs.
const homePageQuery = () => getPageOptions({ path: { slug: 'home' } })

/** The config is untrusted (`unknown` in the contract) — blockprint validates per block at render. */
function configEntries(config: unknown): Array<{ type?: unknown; props?: unknown }> {
  return Array.isArray(config) ? (config as Array<{ type?: unknown; props?: unknown }>) : []
}

export const Route = createFileRoute('/')({
  // Config-driven SSR: fetch the page, then prefetch the data its blocks ask
  // for (product strips, tile counts), so first paint ships real HTML.
  loader: async ({ context }) => {
    const page = await context.queryClient.ensureQueryData(homePageQuery())
    const entries = configEntries(page.config)
    await Promise.all([
      ...entries
        .filter((entry) => entry.type === 'productStrip')
        .map((entry) => productStripSchema.safeParse(entry.props))
        .filter((parsed) => parsed.success)
        .map((parsed) => context.queryClient.ensureQueryData(productStripQuery(parsed.data))),
      ...(entries.some((entry) => entry.type === 'categoryTiles')
        ? [context.queryClient.ensureQueryData(categoryCountsQuery())]
        : []),
    ])
  },
  head: () => ({
    meta: [
      { title: 'Ethereal Nature — botanicals, oils, crystals & teas' },
      {
        name: 'description',
        content:
          'Small-batch essential oils, dried herbs, crystals, and loose-leaf teas, sourced with care.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const { data: page } = useQuery(homePageQuery())

  return (
    <main className="flex flex-col">
      <Renderer config={page?.config ?? []} registry={homeRegistry} />
    </main>
  )
}
