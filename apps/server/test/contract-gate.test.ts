import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import spec from '@ethereal-nature/api-client/openapi.json' with { type: 'json' }
import { fastifyPath } from '../src/platform/contract.js'
import { startTestApp, type TestHarness } from './helpers.js'

/**
 * Anti-drift gate: Path 3 makes the committed spec the runtime source of
 * truth, so the one failure mode left is a route whose registration diverges
 * from the spec it's wired to. This asserts a strict bijection between the
 * spec's operations and the Fastify route table (both flags on).
 */
let harness: TestHarness

beforeAll(async () => {
  harness = await startTestApp({ DEMO_LOGIN_ENABLED: 'true', MOCK_PSP_ENABLED: 'true' })
})

afterAll(async () => {
  await harness.close()
})

const METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const

function specOperations(): Array<{ method: string; path: string }> {
  const ops: Array<{ method: string; path: string }> = []
  for (const [path, item] of Object.entries(spec.paths as Record<string, Record<string, unknown>>)) {
    for (const method of METHODS) {
      if (item[method]) ops.push({ method: method.toUpperCase(), path: fastifyPath(path as never) })
    }
  }
  return ops
}

describe('contract ↔ route bijection', () => {
  it('every spec operation is registered as a Fastify route', () => {
    const registered = new Set(harness.app.routes.map((r) => `${r.method} ${r.path}`))
    const missing = specOperations().filter((op) => !registered.has(`${op.method} ${op.path}`))
    expect(missing).toEqual([])
    expect(specOperations()).toHaveLength(27)
  })

  it('every registered route (minus infrastructure) is in the spec', () => {
    const specced = new Set(specOperations().map((op) => `${op.method} ${op.path}`))
    const INFRASTRUCTURE = new Set(['GET /openapi.json'])
    const unspecced = harness.app.routes
      .map((r) => `${r.method} ${r.path}`)
      .filter((key) => !specced.has(key) && !INFRASTRUCTURE.has(key))
    expect(unspecced).toEqual([])
  })

  it('flag-gated operations disappear from the served spec when disabled', async () => {
    const disabled = await startTestApp({
      DEMO_LOGIN_ENABLED: 'false',
      MOCK_PSP_ENABLED: 'false',
      VIEWER_EMAIL: `viewer-gate-${Date.now()}@ethereal.dev`,
    })
    try {
      const res = await disabled.app.fastify.inject({ method: 'GET', url: '/openapi.json' })
      const paths = Object.keys(res.json().paths)
      expect(paths).not.toContain('/auth/demo')
      expect(paths).not.toContain('/mock-psp/intents/{id}/simulate')
      expect(paths).toHaveLength(Object.keys(spec.paths).length - 2)
    } finally {
      await disabled.close()
    }
  })
})
