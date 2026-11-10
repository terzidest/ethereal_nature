// App chrome: the header's Daylight / Night garden switch.
import { useTheme } from './theme'

/**
 * Both icons are always rendered and CSS shows the one for the theme on
 * screen (moon in Daylight, sun in Night garden), so the markup is identical
 * on the server and the client whatever the visitor's saved choice.
 */
export function ThemeSwitch() {
  const { toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink-soft transition hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] fill-none stroke-current stroke-2 dark:hidden"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="hidden h-[18px] w-[18px] fill-none stroke-current stroke-2 dark:block"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  )
}
