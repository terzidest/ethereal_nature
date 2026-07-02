import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    nitro(),
    tailwindcss(),
    // Admin is an authenticated back-office — no SEO, no SSR payoff (ADR-0002).
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ],
})
