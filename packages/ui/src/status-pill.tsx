import type { ReactNode } from 'react'

interface StatusPillProps {
  tone: 'ok' | 'error' | 'pending'
  children: ReactNode
}

const toneClasses: Record<StatusPillProps['tone'], string> = {
  ok: 'bg-brand-soft text-heading',
  error: 'bg-danger-wash text-danger',
  pending: 'bg-sand-100 text-ink-soft',
}

export function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
