import { getHealthOptions } from '@ethereal-nature/api-client'
import { StatusPill } from '@ethereal-nature/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data, isPending, isError } = useQuery(getHealthOptions())

  const tone = isPending ? 'pending' : isError || data?.database !== 'up' ? 'error' : 'ok'

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight text-brand-900">Admin</h1>
      <p className="text-lg">Back-office shell — Phase 0. Backend status via the generated client:</p>
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
