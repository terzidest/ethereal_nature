import {
  getCurrentUser,
  setApiAuthToken,
  type AuthResponse,
  type UserResponse,
} from '@ethereal-nature/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

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
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsRestoring(false)
      return
    }
    setApiAuthToken(token)
    getCurrentUser({ throwOnError: true })
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setApiAuthToken(null)
      })
      .finally(() => setIsRestoring(false))
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
