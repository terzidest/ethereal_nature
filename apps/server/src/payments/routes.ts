import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { fastifyPath, opSchema } from '../platform/contract.js'
import { BadRequestError } from '../platform/errors.js'
import { requireAuth, type TokenService } from '../platform/security.js'
import { WebhookSignature, type PaymentIntent } from './domain.js'
import type { PaymentsSettings, PaymentsUseCases, PspEvent } from './use-cases.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function intentIdFrom(raw: string | undefined): string {
  if (!raw) throw new BadRequestError('Missing intent id')
  if (!UUID_PATTERN.test(raw)) throw new BadRequestError(`Invalid intent id: ${raw}`)
  return raw.toLowerCase()
}

function toIntentResponse(intent: PaymentIntent) {
  return {
    id: intent.id,
    orderId: intent.orderId,
    amountMinor: intent.amountMinor,
    currency: intent.currency,
    status: intent.status,
    createdAtEpochSeconds: Math.floor(intent.createdAt.getTime() / 1000),
  }
}

export function paymentRoutes(app: FastifyInstance, payments: PaymentsUseCases, tokens: TokenService): void {
  const authed = requireAuth(tokens)

  app.post(
    '/payments/intents',
    { schema: opSchema('/payments/intents', 'post'), preHandler: authed },
    async (request, reply) => {
      const { orderId } = request.body as { orderId: string }
      if (!UUID_PATTERN.test(orderId)) throw new BadRequestError(`Invalid order id: ${orderId}`)
      const outcome = await payments.createPaymentIntent(orderId.toLowerCase(), request.authUser!.id)
      return reply.status(outcome.kind === 'created' ? 201 : 200).send(toIntentResponse(outcome.intent))
    },
  )

  app.get(
    fastifyPath('/payments/intents/{id}'),
    { schema: opSchema('/payments/intents/{id}', 'get'), preHandler: authed },
    async (request) => {
      const { id } = request.params as { id: string }
      return toIntentResponse(await payments.getPaymentIntent(intentIdFrom(id), request.authUser!.id))
    },
  )

  // Raw-body scope: the HMAC is computed over the exact bytes, so JSON
  // parsing must not happen before verification.
  app.register(async (scope) => {
    scope.removeContentTypeParser(['application/json'])
    scope.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => done(null, body))
    scope.addContentTypeParser('*', { parseAs: 'string' }, (_req, body, done) => done(null, body))

    scope.post('/payments/webhook', { schema: opSchema('/payments/webhook', 'post') }, async (request) => {
      const signature = request.headers['x-webhook-signature']
      const outcome = await payments.handlePspEvent(
        request.body as string,
        typeof signature === 'string' ? signature : null,
      )
      return { status: outcome }
    })
  })
}

/**
 * Stand-in for the payment provider, registered only when mockPspEnabled.
 * Builds the signed provider event and pushes it through the same
 * handlePspEvent path the public webhook uses — a real sign→verify round
 * trip, in-process.
 */
export function mockPspRoutes(
  app: FastifyInstance,
  payments: PaymentsUseCases,
  settings: PaymentsSettings,
  tokens: TokenService,
): void {
  app.post(
    fastifyPath('/mock-psp/intents/{id}/simulate'),
    { schema: opSchema('/mock-psp/intents/{id}/simulate', 'post'), preHandler: requireAuth(tokens) },
    async (request) => {
      const { id } = request.params as { id: string }
      const { outcome } = request.body as { outcome: 'PAY' | 'DECLINE' }
      const intentId = intentIdFrom(id)
      const userId = request.authUser!.id
      await payments.getPaymentIntent(intentId, userId) // ownership gate — 404s for anyone else's intent

      const event: PspEvent = {
        eventId: randomUUID(),
        intentId,
        type: outcome === 'PAY' ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED',
      }
      const body = JSON.stringify(event)
      await payments.handlePspEvent(body, WebhookSignature.sign(settings.webhookSecret, body))

      return toIntentResponse(await payments.getPaymentIntent(intentId, userId))
    },
  )
}
