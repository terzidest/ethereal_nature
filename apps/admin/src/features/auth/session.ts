import {
  getCurrentUser,
  setApiAuthToken,
  type AuthResponse,
  type UserResponse,
} from '@ethereal-nature/api-client'

const TOKEN_KEY = 'ethereal-nature.admin.token'

let currentUser: UserResponse | null = null
let restorePromise: Promise<UserResponse | null> | null = null

/**
 * Module-level session store so the router's beforeLoad guards can consult it.
 * The client-side gate is UX only — the backend rejects unauthorized calls
 * regardless of anything stored here.
 */
export function ensureSession(): Promise<UserResponse | null> {
  // Not in a browser (SPA-shell prerender / SSR): there is no token and no
  // localStorage. Don't memoize — the real check must still run client-side.
  if (typeof window === 'undefined') return Promise.resolve(null)
  restorePromise ??= (async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    setApiAuthToken(token)
    try {
      const { data } = await getCurrentUser({ throwOnError: true })
      currentUser = data
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setApiAuthToken(null)
      currentUser = null
    }
    return currentUser
  })()
  return restorePromise
}

export function establishSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token)
  setApiAuthToken(auth.token)
  currentUser = auth.user
  restorePromise = Promise.resolve(currentUser)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  setApiAuthToken(null)
  currentUser = null
  restorePromise = Promise.resolve(null)
}

export function sessionUser(): UserResponse | null {
  return currentUser
}
