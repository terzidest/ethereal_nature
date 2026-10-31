/// <reference types="vitest/config" />
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
    // blockprint 0.1.1's ESM dist uses extensionless relative imports, which
    // only bundlers resolve — it must never stay external to the node build.
    noExternal: [/^@radix-ui\//, 'react-remove-scroll', 'react-remove-scroll-bar', 'react-style-singleton', 'use-callback-ref', 'use-sidecar', 'aria-hidden', 'tslib', 'blockprint'],
  },
  plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
  test: {
    // Same extensionless-imports issue: route blockprint through vite's
    // resolver instead of node's ESM loader.
    server: { deps: { inline: ['blockprint'] } },
  },
})
