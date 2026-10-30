import type { FastifyInstance } from 'fastify'
import { fastifyPath, opSchema } from '../platform/contract.js'
import { requireAnyRole, requireAuth, type TokenService } from '../platform/security.js'
import { parseEmail, parseRawPassword, type User } from './domain.js'
import type { AuthResult, IdentityUseCases } from './use-cases.js'

interface Credentials {
  email: string
  password: string
}

function toUserResponse(user: User) {
  return { id: user.id, email: user.email, role: user.role }
}

function toAuthResponse({ user, token }: AuthResult) {
  return {
    token: token.token,
    expiresAtEpochSeconds: token.expiresAtEpochSeconds,
    user: toUserResponse(user),
  }
}

export function authRoutes(app: FastifyInstance, identity: IdentityUseCases, tokens: TokenService): void {
  app.post('/auth/register', { schema: opSchema('/auth/register', 'post') }, async (request, reply) => {
    const dto = request.body as Credentials
    const result = await identity.registerUser(parseEmail(dto.email), parseRawPassword(dto.password))
    return reply.status(201).send(toAuthResponse(result))
  })

  app.post('/auth/login', { schema: opSchema('/auth/login', 'post') }, async (request) => {
    const dto = request.body as Credentials
    return toAuthResponse(await identity.authenticateUser(parseEmail(dto.email), parseRawPassword(dto.password)))
  })

  app.get(
    '/auth/me',
    { schema: opSchema('/auth/me', 'get'), preHandler: requireAuth(tokens) },
    async (request) => toUserResponse(await identity.getUser(request.authUser!.id)),
  )

  app.get(
    '/auth/users',
    { schema: opSchema('/auth/users', 'get'), preHandler: requireAnyRole(tokens, 'ADMIN') },
    async () => ({ users: (await identity.listUsers()).map(toUserResponse) }),
  )
}

/** Registered only when demo.loginEnabled — absent (404) everywhere else. */
export function demoAuthRoutes(app: FastifyInstance, identity: IdentityUseCases): void {
  app.post(fastifyPath('/auth/demo'), { schema: opSchema('/auth/demo', 'post') }, async () =>
    toAuthResponse(await identity.demoLogin()),
  )
}
