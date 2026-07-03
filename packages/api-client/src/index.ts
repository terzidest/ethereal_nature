// Public surface of the generated API client. Everything under ./generated is
// produced by @hey-api/openapi-ts from the backend's openapi.json — never
// hand-edit it; run `pnpm generate:client` with the backend running instead.
export * from './generated'
export * from './generated/@tanstack/react-query.gen'
export { client } from './generated/client.gen'

import { client } from './generated/client.gen'

/** Point the client at the backend. Call once at app startup. */
export function configureApiClient(config: { baseUrl: string }) {
  client.setConfig({ baseUrl: config.baseUrl })
}

/**
 * Attach (or clear) the bearer token for subsequent requests.
 * Browser-only by design: the SSR pass stays anonymous so one request's
 * session can never leak into another's render.
 */
export function setApiAuthToken(token: string | null) {
  client.setConfig({
    ...client.getConfig(),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
