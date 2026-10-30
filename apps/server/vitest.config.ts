import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // HTTP tests share one real Postgres database (same convention as the
    // Kotlin suite) — keep them in one worker to avoid cross-test races.
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    testTimeout: 15000,
  },
})
