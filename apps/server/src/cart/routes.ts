import type { FastifyInstance } from 'fastify'
import { opSchema } from '../platform/contract.js'
import { BadRequestError } from '../platform/errors.js'
import { requireAuth, type TokenService } from '../platform/security.js'
import { makeGuestLine, type Adjustments } from './domain.js'
import type { CartSnapshot, CartUseCases } from './use-cases.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseUuid(raw: string, what: string): string {
  if (!UUID_PATTERN.test(raw)) throw new BadRequestError(`Invalid ${what}: ${raw}`)
  return raw.toLowerCase()
}

const toCartResponse = (cart: CartSnapshot) => cart
const toAdjustmentsResponse = (adjustments: Adjustments) => adjustments

interface MergeDto {
  mergeId: string
  lines: Array<{ productId: string; quantity: number; priceSnapshotMinor?: number | null }>
}

export function cartRoutes(app: FastifyInstance, cart: CartUseCases, tokens: TokenService): void {
  const preHandler = requireAuth(tokens)

  app.get('/cart', { schema: opSchema('/cart', 'get'), preHandler }, async (request) =>
    toCartResponse(await cart.getCart(request.authUser!.id)),
  )

  app.post('/cart/merge', { schema: opSchema('/cart/merge', 'post'), preHandler }, async (request) => {
    const dto = request.body as MergeDto
    const outcome = await cart.mergeCart(
      request.authUser!.id,
      dto.lines.map((l) =>
        makeGuestLine(parseUuid(l.productId, 'product id'), l.quantity, l.priceSnapshotMinor ?? null),
      ),
      parseUuid(dto.mergeId, 'merge id'),
    )
    return { cart: toCartResponse(outcome.cart), adjustments: toAdjustmentsResponse(outcome.adjustments) }
  })

  app.put('/cart/items', { schema: opSchema('/cart/items', 'put'), preHandler }, async (request) => {
    const dto = request.body as { productId: string; quantity: number }
    return toCartResponse(
      await cart.setCartItem(request.authUser!.id, parseUuid(dto.productId, 'product id'), dto.quantity),
    )
  })
}
