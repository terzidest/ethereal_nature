import type { ReactNode } from 'react'

interface StatusPillProps {
  tone: 'ok' | 'error' | 'pending'
  children: ReactNode
}

const toneClasses: Record<StatusPillProps['tone'], string> = {
  ok: 'bg-brand-100 text-brand-900',
  error: 'bg-red-100 text-red-900',
  pending: 'bg-gray-100 text-gray-600',
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
