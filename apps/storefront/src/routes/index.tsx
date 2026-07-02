import { getHealthOptions } from '@ethereal-nature/api-client'
import { StatusPill } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  // Server state is fetched in the loader and hydrated into React Query —
  // the pattern every SSR route in this app follows.
  loader: ({ context }) => context.queryClient.ensureQueryData(getHealthOptions()),
  component: Home,
})

function Home() {
  const { data, isPending, isError } = useQuery(getHealthOptions())

  const tone = isPending ? 'pending' : isError || data?.database !== 'up' ? 'error' : 'ok'

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight text-brand-900">Ethereal Nature</h1>
      <p className="text-lg">
        Storefront shell — Phase 0. The pill below comes from the generated
        <code className="mx-1 rounded bg-brand-50 px-1.5 py-0.5 text-sm">@ethereal-nature/api-client</code>
        health hook.
      </p>
      <StatusPill tone={tone}>
        {isPending
          ? 'Checking backend…'
          : isError
            ? 'Backend unreachable'
            : `API ${data.status} · database ${data.database}`}
      </StatusPill>
    </main>
  )
}
