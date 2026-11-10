import {
  getCurrentUser,
  setApiAuthToken,
  type AuthResponse,
  type UserResponse,
} from '@ethereal-nature/api-client'
import { restoreFailureAction } from './restore'

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
    let status: number | undefined
    try {
      const result = await getCurrentUser()
      if (result.data) {
        currentUser = result.data
        return currentUser
      }
      status = result.response.status
    } catch {
      // no response at all: aborted (e.g. reload mid-request) or offline
    }
    // Only a 401 invalidates the token. On any other failure keep it stored
    // and drop the memo so the next guard check retries the restore.
    if (restoreFailureAction(status) === 'clear') {
      localStorage.removeItem(TOKEN_KEY)
    } else {
      restorePromise = null
    }
    setApiAuthToken(null)
    currentUser = null
    return null
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
