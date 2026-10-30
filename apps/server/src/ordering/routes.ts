import type { FastifyInstance, FastifySchema } from 'fastify'
import { fastifyPath, opSchema } from '../platform/contract.js'
import { BadRequestError } from '../platform/errors.js'
import { requireAnyRole, requireAuth, type TokenService } from '../platform/security.js'
import {
  lineTotalMinor,
  ORDER_STATUSES,
  orderCurrency,
  orderTotalMinor,
  type CheckoutIssue,
  type Order,
  type OrderStatus,
} from './domain.js'
import { orderTotalPages, type OrderingUseCases, type OrderPage } from './use-cases.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function orderIdFrom(raw: string | undefined): string {
  if (!raw) throw new BadRequestError('Missing order id')
  if (!UUID_PATTERN.test(raw)) throw new BadRequestError(`Invalid order id: ${raw}`)
  return raw.toLowerCase()
}

function toOrderResponse(order: Order) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    lines: order.lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      unitPriceMinor: line.unitPriceMinor,
      currency: line.currency,
      lineTotalMinor: lineTotalMinor(line),
    })),
    totalMinor: orderTotalMinor(order),
    currency: orderCurrency(order),
    placedAtEpochSeconds: Math.floor(order.placedAt.getTime() / 1000),
  }
}

/** Null-omission: a missing product name is omitted, not null. */
function toIssueDto(issue: CheckoutIssue) {
  return {
    productId: issue.productId,
    name: issue.name ?? undefined,
    kind: issue.kind,
    requestedQuantity: issue.requestedQuantity,
    availableStock: issue.availableStock,
  }
}

function toListResponse(page: OrderPage) {
  return {
    items: page.items.map(toOrderResponse),
    page: page.page,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: orderTotalPages(page),
  }
}

function lenientQuerySchema(schema: FastifySchema): FastifySchema {
  const rest = { ...schema }
  delete rest.querystring
  return rest
}

export function orderRoutes(app: FastifyInstance, ordering: OrderingUseCases, tokens: TokenService): void {
  const authed = requireAuth(tokens)

  app.post('/orders', { schema: opSchema('/orders', 'post'), preHandler: authed }, async (request, reply) => {
    const { expectedTotalMinor } = request.body as { expectedTotalMinor: number }
    const outcome = await ordering.placeOrder(request.authUser!.id, expectedTotalMinor)
    if (outcome.kind === 'placed') return reply.status(201).send(toOrderResponse(outcome.order))
    return reply
      .status(409)
      .send({ issues: outcome.issues.map(toIssueDto), currentTotalMinor: outcome.currentTotalMinor })
  })

  app.get('/orders', { schema: opSchema('/orders', 'get'), preHandler: authed }, async (request) =>
    (await ordering.getMyOrders(request.authUser!.id)).map(toOrderResponse),
  )

  app.get(
    fastifyPath('/orders/{id}'),
    { schema: opSchema('/orders/{id}', 'get'), preHandler: authed },
    async (request) => {
      const { id } = request.params as { id: string }
      const role = request.authUser!.role
      const canViewAnyOrder = role === 'ADMIN' || role === 'VIEWER'
      return toOrderResponse(await ordering.getOrder(orderIdFrom(id), request.authUser!.id, canViewAnyOrder))
    },
  )

  // Reads are open to the demo viewer; the status transition stays ADMIN-only.
  app.get(
    '/admin/orders',
    {
      schema: lenientQuerySchema(opSchema('/admin/orders', 'get')),
      preHandler: requireAnyRole(tokens, 'ADMIN', 'VIEWER'),
    },
    async (request) => {
      const query = request.query as { page?: string; pageSize?: string; status?: string }
      const page = Math.max(1, Number.parseInt(query.page ?? '', 10) || 1)
      const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize ?? '', 10) || 25))
      const status =
        ORDER_STATUSES.find((s) => s.toLowerCase() === query.status?.toLowerCase()) ?? null
      return toListResponse(await ordering.listOrders(page, pageSize, status))
    },
  )

  app.post(
    fastifyPath('/admin/orders/{id}/status'),
    { schema: opSchema('/admin/orders/{id}/status', 'post'), preHandler: requireAnyRole(tokens, 'ADMIN') },
    async (request) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: OrderStatus }
      return toOrderResponse(await ordering.transitionOrderStatus(orderIdFrom(id), status))
    },
  )
}
