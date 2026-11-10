// App chrome: the few stroke icons the shell uses (24px grid, currentColor).
import type { ReactNode } from 'react'

function Icon({ className = 'h-5 w-5', children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fill-none stroke-current ${className}`}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Icon>
)
export const ShopIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
  </Icon>
)
export const BagIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9zM9 8V6.5a3 3 0 0 1 6 0V8" />
  </Icon>
)
export const SearchIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M20 20l-4.2-4.2M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
  </Icon>
)
export const UserIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
  </Icon>
)
