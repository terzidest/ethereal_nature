// App chrome (not a feature slice): the shared page title row.
import type { ReactNode } from 'react'

export function PageHeader({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-brand-900">{title}</h1>
      {hint !== undefined && <span className="text-sm text-ink/50">{hint}</span>}
      {action !== undefined && <div className="ml-auto">{action}</div>}
    </header>
  )
}
