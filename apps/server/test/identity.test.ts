import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startTestApp, type TestHarness } from './helpers.js'

let harness: TestHarness

beforeAll(async () => {
  harness = await startTestApp()
})

afterAll(async () => {
  await harness.close()
})

const inject = (opts: InjectOptions) => harness.app.fastify.inject(opts)

const freshEmail = () => `auth-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`

async function register(email: string, password = 's3cret-pass') {
  return inject({ method: 'POST', url: '/auth/register', payload: { email, password } })
}

async function adminToken(): Promise<string> {
  // The local admin user's bcrypt hash was written by the Kotlin backend —
  // logging in here is the cross-stack hash-continuity proof.
  const res = await inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@ethereal.dev', password: 'admin-dev-password' },
  })
  expect(res.statusCode).toBe(200)
  return res.json().token as string
}

describe('auth routes (ported from AuthRoutesTest)', () => {
  it('register → login round-trip; duplicate email is a 409', async () => {
    const email = freshEmail()
    const registered = await register(email)
    expect(registered.statusCode).toBe(201)
    const auth = registered.json()
    expect(auth.user.role).toBe('CUSTOMER')
    expect(auth.user.email).toBe(email)
    expect(auth.token.length).toBeGreaterThan(0)
    expect(auth.expiresAtEpochSeconds).toBeGreaterThan(Date.now() / 1000)

    const login = await inject({ method: 'POST', url: '/auth/login', payload: { email, password: 's3cret-pass' } })
    expect(login.statusCode).toBe(200)
    expect(login.json().user.id).toBe(auth.user.id)

    const dup = await register(email)
    expect(dup.statusCode).toBe(409)
    expect(dup.json().code).toBe('EMAIL_ALREADY_REGISTERED')
    expect(dup.body).not.toContain(email) // email never echoed back
  })

  it('email and password shapes are validated', async () => {
    const badEmail = await register('not-an-email')
    expect(badEmail.statusCode).toBe(400)
    expect(badEmail.json().code).toBe('VALIDATION')

    const shortPassword = await register(freshEmail(), 'short')
    expect(shortPassword.statusCode).toBe(400)
    expect(shortPassword.json().code).toBe('VALIDATION')
  })

  it('/auth/me requires a token and returns the current user', async () => {
    const anonymous = await inject({ method: 'GET', url: '/auth/me' })
    expect(anonymous.statusCode).toBe(401)
    expect(anonymous.json().code).toBe('UNAUTHORIZED')

    const email = freshEmail()
    const token = (await register(email)).json().token as string
    const me = await inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${token}` } })
    expect(me.statusCode).toBe(200)
    expect(me.json().email).toBe(email)
  })

  it('admin endpoint enforces the role server-side', async () => {
    const anonymous = await inject({ method: 'GET', url: '/auth/users' })
    expect(anonymous.statusCode).toBe(401)

    const customer = (await register(freshEmail())).json().token as string
    const forbidden = await inject({
      method: 'GET',
      url: '/auth/users',
      headers: { authorization: `Bearer ${customer}` },
    })
    expect(forbidden.statusCode).toBe(403)
    expect(forbidden.json().code).toBe('FORBIDDEN')

    const admin = await adminToken()
    const allowed = await inject({ method: 'GET', url: '/auth/users', headers: { authorization: `Bearer ${admin}` } })
    expect(allowed.statusCode).toBe(200)
    expect(allowed.body).toContain('ADMIN')
  })

  it('tampered tokens are rejected', async () => {
    const token = (await register(freshEmail())).json().token as string
    const tampered = token.slice(0, -4) + 'XXXX'
    const res = await inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${tampered}` } })
    expect(res.statusCode).toBe(401)
  })
})

describe('demo login (ported from DemoLoginTest)', () => {
  it('issues a working viewer token', async () => {
    const res = await inject({ method: 'POST', url: '/auth/demo' })
    expect(res.statusCode).toBe(200)
    const auth = res.json()
    expect(auth.user.role).toBe('VIEWER')
    expect(auth.token.length).toBeGreaterThan(0)

    const me = await inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${auth.token}` } })
    expect(me.statusCode).toBe(200)
    expect(me.json().role).toBe('VIEWER')
  })

  it('viewer cannot list user accounts', async () => {
    const token = (await inject({ method: 'POST', url: '/auth/demo' })).json().token as string
    const res = await inject({ method: 'GET', url: '/auth/users', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(403)
  })

  it('disabled demo mode means no endpoint and no seeded viewer', async () => {
    // Fresh viewer email proves bootstrap skipped seeding on this app instance.
    const email = `viewer-disabled-${Date.now()}@ethereal.dev`
    const disabled = await startTestApp({ DEMO_LOGIN_ENABLED: 'false', VIEWER_EMAIL: email })
    try {
      const demo = await disabled.app.fastify.inject({ method: 'POST', url: '/auth/demo' })
      expect(demo.statusCode).toBe(404)

      const login = await disabled.app.fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password: 'viewer-dev-password' },
      })
      expect(login.statusCode).toBe(401)
      expect(login.json().code).toBe('INVALID_CREDENTIALS')
    } finally {
      await disabled.close()
    }
  })
})
