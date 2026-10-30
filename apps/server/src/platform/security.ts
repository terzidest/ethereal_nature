import { createSecretKey } from 'node:crypto'
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import type { AppConfig } from './config.js'

/**
 * JWT compatibility layer: HS256 with the exact claim set the Kotlin backend
 * writes (iss, aud, sub, email, role, exp — no iat), verified with the same
 * issuer/audience requirements. Tokens issued before the migration keep
 * working, and vice versa.
 */
export interface TokenClaims {
  sub: string
  email: string
  role: string
}

export interface IssuedToken {
  token: string
  expiresAtEpochSeconds: number
}

export interface TokenService {
  issue(claims: TokenClaims): Promise<IssuedToken>
  verify(token: string): Promise<(JWTPayload & { email?: string; role?: string }) | null>
}

export function createTokenService(jwt: AppConfig['jwt']): TokenService {
  const key = createSecretKey(Buffer.from(jwt.secret, 'utf8'))
  return {
    async issue(claims) {
      const expiresAtEpochSeconds = Math.floor(Date.now() / 1000) + jwt.expiresInMinutes * 60
      const token = await new SignJWT({ email: claims.email, role: claims.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(jwt.issuer)
        .setAudience(jwt.audience)
        .setSubject(claims.sub)
        .setExpirationTime(expiresAtEpochSeconds)
        .sign(key)
      return { token, expiresAtEpochSeconds }
    },
    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, key, { issuer: jwt.issuer, audience: jwt.audience })
        // Ktor's validate{} rejects tokens without a subject.
        if (!payload.sub) return null
        return payload
      } catch {
        return null
      }
    },
  }
}

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthenticatedUser | null
  }
}

function unauthorized(reply: FastifyReply) {
  return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Missing or invalid token' })
}

/** authenticate(JWT_AUTH) equivalent: any valid token. */
export function requireAuth(tokens: TokenService): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    const payload = token ? await tokens.verify(token) : null
    if (!payload) return unauthorized(reply)
    request.authUser = {
      id: payload.sub as string,
      email: (payload.email as string | undefined) ?? '',
      role: (payload.role as string | undefined) ?? '',
    }
  }
}

/** requireAnyRole equivalent: valid token AND role in the allow-set. */
export function requireAnyRole(tokens: TokenService, ...roles: string[]): preHandlerHookHandler {
  const allowed = new Set(roles)
  const auth = requireAuth(tokens)
  return async function (this: unknown, request, reply, done) {
    await (auth as (req: FastifyRequest, rep: FastifyReply) => Promise<void>).call(this, request, reply)
    if (reply.sent) return
    if (!allowed.has(request.authUser?.role ?? '')) {
      return reply
        .status(403)
        .send({ code: 'FORBIDDEN', message: `Requires one of: ${[...allowed].join(', ')}` })
    }
    void done
  }
}
