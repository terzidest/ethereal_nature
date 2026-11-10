import {
  getCurrentUser,
  setApiAuthToken,
  type AuthResponse,
  type UserResponse,
} from '@ethereal-nature/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { restoreFailureAction } from './restore'

const TOKEN_KEY = 'ethereal-nature.token'

interface Session {
  user: UserResponse | null
  /** true while a persisted token is being validated on first load */
  isRestoring: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
}

const SessionContext = createContext<Session | null>(null)

/**
 * Session lives in Context (DI value, ADR-0008). The token is persisted in
 * localStorage and only ever attached to requests in the browser — SSR
 * renders anonymously, which is fine: account data is client-interactive.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return null
      setApiAuthToken(token)
      let status: number | undefined
      try {
        const result = await getCurrentUser()
        if (result.data) return result.data
        status = result.response.status
      } catch {
        // no response at all: aborted (e.g. reload mid-request) or offline
      }
      // Only a 401 invalidates the token. On any other failure keep it stored
      // so the next visit retries, but browse anonymously for now so the UI
      // and the API agree on who the shopper is.
      if (restoreFailureAction(status) === 'clear') localStorage.removeItem(TOKEN_KEY)
      setApiAuthToken(null)
      return null
    }
    void restore().then((restored) => {
      if (cancelled) return
      setUser(restored)
      setIsRestoring(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback((auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.token)
    setApiAuthToken(auth.token)
    setUser(auth.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setApiAuthToken(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  return (
    <SessionContext.Provider value={{ user, isRestoring, login, logout }}>{children}</SessionContext.Provider>
  )
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside AuthProvider')
  return session
}
