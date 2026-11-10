// SPA-mode hydration gate.
//
// The prerendered shell contains only the root route: the matched child is
// rendered as the pending fallback, and React hydrates the route area against
// that fallback. Start starts the client's first `router.load()` before React
// has hydrated it, so a load that settles quickly (a signed-out visitor
// redirected to /login, or a route resolving and dropping its pending state)
// swaps the route tree under a boundary that is still dehydrated, which is a
// hydration mismatch.
//
// React hydrates the route area in its own pass after the root commits, so the
// root's effects fire too early. The pending fallback is the one component
// inside that area, so its first effect marks the shell as hydrated. The
// top-level routes (`/_authed`, `/login`) await that in `beforeLoad` — the root
// route's own `beforeLoad` is skipped on the first client load because its
// match comes dehydrated from the shell. A new top-level route must await it
// too. Outside the browser (the shell prerender) it never blocks.

let markHydrated!: () => void
const hydrated = new Promise<void>((resolve) => {
  markHydrated = resolve
})

/** Resolves once the shell's route area has hydrated. Settles once; later awaits are free. */
export function whenShellHydrated(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  return hydrated
}

/** Called from the pending fallback's effect (the one component the shell renders there). */
export function markShellHydrated(): void {
  markHydrated()
}
