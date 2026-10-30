import type { FastifyError, FastifyInstance } from 'fastify'

/**
 * Domain errors carry their HTTP mapping declaratively; the single error
 * handler below is the only place errors become responses (the StatusPages
 * mirror). Contexts subclass AppError in their domain layer.
 */
export abstract class AppError extends Error {
  abstract readonly status: number
  abstract readonly code: string
}

/** Port of Kotlin's IllegalArgumentException from value-object `require()`s. */
export class DomainValidationError extends AppError {
  readonly status = 400
  readonly code = 'VALIDATION'
}

/** Port of Ktor's BadRequestException (malformed UUIDs, unreadable bodies). */
export class BadRequestError extends AppError {
  readonly status = 400
  readonly code = 'BAD_REQUEST'
}

/** Mirror of Kotlin's `require(…) { msg }` producing a 400 VALIDATION. */
export function domainRequire(condition: boolean, message: string): asserts condition {
  if (!condition) throw new DomainValidationError(message)
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | AppError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.status).send({ code: error.code, message: error.message })
    }
    // AJV schema validation failures (bad body/query shape) — Ktor surfaced
    // these as BadRequestException → 400 BAD_REQUEST.
    const fastifyError = error as FastifyError
    if (fastifyError.validation || fastifyError.statusCode === 400) {
      return reply.status(400).send({ code: 'BAD_REQUEST', message: error.message })
    }
    app.log.error(error, 'Unhandled exception')
    return reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Unexpected server error' })
  })

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({ code: 'NOT_FOUND', message: 'Route not found' })
  })
}
