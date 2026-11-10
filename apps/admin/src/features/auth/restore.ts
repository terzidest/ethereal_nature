/**
 * What a failed `GET /auth/me` during session restore means for the stored
 * token. Only a 401 proves the token is invalid or expired; anything else
 * (aborted request, network blip, API briefly down, 5xx) says nothing about
 * the token, so it is kept and the restore is retried on a later visit.
 *
 * `status` is the HTTP status, or `undefined` when no response arrived.
 */
export function restoreFailureAction(status: number | undefined): 'clear' | 'keep' {
  return status === 401 ? 'clear' : 'keep'
}
