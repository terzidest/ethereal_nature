// App chrome (not a feature slice): the colour theme, Daylight / Night garden.
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

const THEME_KEY = 'ethereal-nature.theme'

/**
 * Inline <head> script: applies a saved choice before first paint, so a
 * returning visitor never sees the other theme flash. With nothing saved the
 * server-rendered `data-theme="system"` stands and CSS follows the device.
 */
export const themeBootScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

/** What the switch flips to: the opposite of what is on screen right now. */
export function nextTheme(preference: ThemePreference, deviceIsDark: boolean): ResolvedTheme {
  const current: ResolvedTheme = preference === 'system' ? (deviceIsDark ? 'dark' : 'light') : preference
  return current === 'dark' ? 'light' : 'dark'
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

// The saved choice is the store; React reads it through useSyncExternalStore
// so the server render ('system') and the first client render agree.
const listeners = new Set<() => void>()
function subscribe(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

interface Theme {
  preference: ThemePreference
  /** Flip between Daylight and Night garden and remember the choice. */
  toggle: () => void
}

const ThemeContext = createContext<Theme | null>(null)

/** Theme lives in Context (DI value, ADR-0008); tokens.css does the painting. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'system' as const)

  const toggle = useCallback(() => {
    const next = nextTheme(readPreference(), window.matchMedia('(prefers-color-scheme: dark)').matches)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Private mode: the choice still applies for this page view.
    }
    document.documentElement.dataset.theme = next
    listeners.forEach((notify) => notify())
  }, [])

  const value = useMemo(() => ({ preference, toggle }), [preference, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>')
  return theme
}
