import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { validatePageConfig } from '../src/content/domain.js'
import { startTestApp, type TestHarness } from './helpers.js'

let harness: TestHarness

beforeAll(async () => {
  harness = await startTestApp()
})

afterAll(async () => {
  await harness.close()
})

const inject = (opts: InjectOptions) => harness.app.fastify.inject(opts)

async function adminToken(): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@ethereal.dev', password: 'admin-dev-password' },
  })
  return res.json().token as string
}

async function viewerToken(): Promise<string> {
  const res = await inject({ method: 'POST', url: '/auth/demo' })
  return res.json().token as string
}

async function customerToken(): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: `content-customer-${Date.now()}@ethereal.dev`, password: 'customer-pass-1' },
  })
  return res.json().token as string
}

/** Reads the current home config so mutation tests can restore it (shared dev DB). */
async function homeConfig(): Promise<unknown> {
  return (await inject({ method: 'GET', url: '/pages/home' })).json().config
}

const putHome = (token: string, config: unknown) =>
  inject({
    method: 'PUT',
    url: '/admin/pages/home',
    headers: { authorization: `Bearer ${token}` },
    payload: { config },
  })

describe('page config structural validation', () => {
  it('accepts entries with type, optional props and id, stripping unknown keys', () => {
    const result = validatePageConfig([
      { type: 'hero', props: { title: 'x' }, id: 'hero', rogue: true },
      { type: 'valueProps' },
      { type: 'strip', id: 7 },
    ])
    expect(result).toEqual([
      { type: 'hero', props: { title: 'x' }, id: 'hero' },
      { type: 'valueProps' },
      { type: 'strip', id: 7 },
    ])
  })

  it('rejects non-arrays, non-object entries, missing/empty/non-string type, bad id', () => {
    expect(() => validatePageConfig({ type: 'hero' })).toThrow(/array/)
    expect(() => validatePageConfig(['hero'])).toThrow(/object/)
    expect(() => validatePageConfig([{ props: {} }])).toThrow(/type/)
    expect(() => validatePageConfig([{ type: '' }])).toThrow(/type/)
    expect(() => validatePageConfig([{ type: 42 }])).toThrow(/type/)
    expect(() => validatePageConfig([{ type: 'hero', id: true }])).toThrow(/id/)
  })
})

describe('GET /pages/{slug}', () => {
  it('serves the seeded home config publicly', async () => {
    const res = await inject({ method: 'GET', url: '/pages/home' })
    expect(res.statusCode).toBe(200)
    const page = res.json()
    expect(page.slug).toBe('home')
    expect(Array.isArray(page.config)).toBe(true)
    expect(page.config.length).toBeGreaterThan(0)
    expect(page.config.every((e: { type?: unknown }) => typeof e.type === 'string')).toBe(true)
    expect(page.updatedAtEpochSeconds).toBeGreaterThan(0)
  })

  it('unknown slug is 404, malformed slug is 400', async () => {
    const missing = await inject({ method: 'GET', url: '/pages/no-such-page' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json().code).toBe('PAGE_NOT_FOUND')
    const malformed = await inject({ method: 'GET', url: '/pages/Not%20A%20Slug' })
    expect(malformed.statusCode).toBe(400)
  })
})

describe('GET /admin/pages', () => {
  it('lists pages for admin and viewer alike', async () => {
    for (const token of [await adminToken(), await viewerToken()]) {
      const res = await inject({ method: 'GET', url: '/admin/pages', headers: { authorization: `Bearer ${token}` } })
      expect(res.statusCode).toBe(200)
      const slugs = res.json().pages.map((p: { slug: string }) => p.slug)
      expect(slugs).toContain('home')
    }
  })

  it('requires a token', async () => {
    const res = await inject({ method: 'GET', url: '/admin/pages' })
    expect(res.statusCode).toBe(401)
  })
})

describe('PUT /admin/pages/{slug}', () => {
  it('round-trips a config edit as admin and serves it on the next GET', async () => {
    const admin = await adminToken()
    const original = await homeConfig()
    try {
      const edited = [{ type: 'hero', props: { title: `Edited ${Date.now()}` }, id: 'hero' }]
      const res = await putHome(admin, edited)
      expect(res.statusCode).toBe(200)
      expect(res.json().config).toEqual(edited)
      expect(await homeConfig()).toEqual(edited)
    } finally {
      expect((await putHome(admin, original)).statusCode).toBe(200)
    }
  })

  it('rejects structurally invalid configs with 400 VALIDATION', async () => {
    const admin = await adminToken()
    for (const config of [{ type: 'hero' }, [{ props: {} }], [{ type: 7 }], 'nope']) {
      const res = await putHome(admin, config)
      expect(res.statusCode).toBe(400)
      expect(res.json().code).toBe('VALIDATION')
    }
  })

  it('unknown slug is 404 — pages are created by migration, not upsert', async () => {
    const admin = await adminToken()
    const res = await inject({
      method: 'PUT',
      url: '/admin/pages/landing',
      headers: { authorization: `Bearer ${admin}` },
      payload: { config: [{ type: 'hero' }] },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().code).toBe('PAGE_NOT_FOUND')
  })

  it('anonymous is 401; customer and viewer are 403', async () => {
    const config = [{ type: 'hero' }]
    const anon = await inject({ method: 'PUT', url: '/admin/pages/home', payload: { config } })
    expect(anon.statusCode).toBe(401)
    expect((await putHome(await customerToken(), config)).statusCode).toBe(403)
    expect((await putHome(await viewerToken(), config)).statusCode).toBe(403)
  })
})
