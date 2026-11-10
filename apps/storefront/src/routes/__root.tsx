import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useEffect } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { ThemeProvider, themeBootScript } from '../components/theme'
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
    // data-theme is rewritten by themeBootScript before hydration, hence the
    // suppressed warning on this one element.
    <html lang="en" data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-surface font-sans text-ink antialiased">
        <ThemeProvider>
          <AuthProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <CartDrawer />
          </AuthProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
