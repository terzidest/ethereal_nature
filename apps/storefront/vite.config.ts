import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    // tslib's UMD entry breaks under vite's SSR interop when inlined; the
    // es6 build has real named exports.
    alias: { tslib: 'tslib/tslib.es6.js' },
  },
  // Bundle Radix's CJS chain into the SSR build: leaving it external trips
  // nitro-nightly's dependency tracer (nf3 → @vercel/nft named-import bug).
  ssr: {
    noExternal: [/^@radix-ui\//, 'react-remove-scroll', 'react-remove-scroll-bar', 'react-style-singleton', 'use-callback-ref', 'use-sidecar', 'aria-hidden', 'tslib'],
  },
  plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
})
