import { listPagesOptions } from '@ethereal-nature/api-client'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageHeader } from '../../../components/PageHeader'

export const Route = createFileRoute('/_authed/pages/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(listPagesOptions()),
  component: PagesListPage,
})

function PagesListPage() {
  const pages = useQuery(listPagesOptions())

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-6 py-8 lg:px-8">
      <PageHeader title="Pages" hint="Storefront pages built from content blocks — edits go live on save." />

      <ul className="divide-y divide-brand-100 rounded-card border border-brand-100 bg-white">
        {pages.data?.pages.map((page) => (
          <li key={page.slug}>
            <Link
              to="/pages/$slug"
              params={{ slug: page.slug }}
              className="flex items-baseline justify-between px-5 py-4 transition hover:bg-brand-50/60"
            >
              <span className="font-medium text-brand-900">/{page.slug === 'home' ? '' : page.slug}</span>
              <span className="text-sm text-ink/50">
                updated {new Date(page.updatedAtEpochSeconds * 1000).toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
        {pages.data?.pages.length === 0 && <li className="px-5 py-4 text-sm text-ink/50">No pages yet.</li>}
      </ul>
    </main>
  )
}
