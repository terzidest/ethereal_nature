import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useEffect } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { AuthProvider } from '../features/account/session'
import { CartDrawer } from '../features/cart/components/CartDrawer'
import { useGuestCart } from '../features/cart/guest-store'
import appCss from '../styles.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Ethereal Nature' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: Outlet,
})

function RootDocument({ children }: { children: ReactNode }) {
  // Persisted stores use skipHydration; rehydrate after mount so the first
  // client render matches the server-rendered HTML.
  useEffect(() => {
    void useGuestCart.persist.rehydrate()
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-surface font-sans text-ink antialiased">
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CartDrawer />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
