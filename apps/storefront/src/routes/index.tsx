import { getPageOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Renderer } from 'blockprint'
import { productStripQuery, productStripSchema } from '../features/pages/blocks/ProductStrip'
import { homeRegistry } from '../features/pages/registry'

// Built lazily: hey-api captures the client baseUrl into the query key at
// creation time, and route modules load before configureApiClient() runs.
const homePageQuery = () => getPageOptions({ path: { slug: 'home' } })

/** The config is untrusted (`unknown` in the contract) — blockprint validates per block at render. */
function configEntries(config: unknown): Array<{ type?: unknown; props?: unknown }> {
  return Array.isArray(config) ? (config as Array<{ type?: unknown; props?: unknown }>) : []
}

export const Route = createFileRoute('/')({
  // Config-driven SSR: fetch the page, then prefetch whatever product strips
  // the config asks for, so first paint ships real product HTML.
  loader: async ({ context }) => {
    const page = await context.queryClient.ensureQueryData(homePageQuery())
    await Promise.all(
      configEntries(page.config)
        .filter((entry) => entry.type === 'productStrip')
        .map((entry) => productStripSchema.safeParse(entry.props))
        .filter((parsed) => parsed.success)
        .map((parsed) => context.queryClient.ensureQueryData(productStripQuery(parsed.data))),
    )
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
