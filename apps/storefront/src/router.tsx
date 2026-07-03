import { configureApiClient } from '@ethereal-nature/api-client'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ErrorFallback, NotFoundFallback, PendingFallback } from './components/RouterFallbacks'
import { routeTree } from './routeTree.gen'

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
})

export function getRouter() {
  const queryClient = new QueryClient()

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: ErrorFallback,
    defaultNotFoundComponent: NotFoundFallback,
    defaultPendingComponent: PendingFallback,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
