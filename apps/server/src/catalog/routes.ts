import type { FastifyInstance, FastifySchema } from 'fastify'
import { fastifyPath, opSchema } from '../platform/contract.js'
import { BadRequestError } from '../platform/errors.js'
import { requireAnyRole, type TokenService } from '../platform/security.js'
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from './domain.js'
import { MAX_PAGE_SIZE, makeProductQuery, totalPages, type ProductPage, type ProductSort } from './ports.js'
import type { CatalogUseCases, ProductInput } from './use-cases.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function productIdFrom(raw: string | undefined): string {
  if (!raw) throw new BadRequestError('Missing product id')
  if (!UUID_PATTERN.test(raw)) throw new BadRequestError(`Invalid product id: ${raw}`)
  return raw.toLowerCase()
}

/** Null-omission convention: optional absent fields are undefined, never null. */
function toProductResponse(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceMinor: product.price.amountMinor,
    currency: product.price.currency,
    stock: product.stock,
    category: product.category,
    imageUrl: product.imageUrl ?? undefined,
    archived: product.archived,
  }
}

function toListResponse(page: ProductPage) {
  return {
    items: page.items.map(toProductResponse),
    page: page.page,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: totalPages(page),
  }
}

/**
 * Query parsing stays handler-level and lenient (Ktor parity: bad page →
 * default, unknown category/sort → ignored/default). An AJV querystring
 * schema would be stricter than the Kotlin backend ever was, so list routes
 * drop it and parse by hand.
 */
function lenientQuerySchema(schema: FastifySchema): FastifySchema {
  const rest = { ...schema }
  delete rest.querystring
  return rest
}

interface ListQuery {
  page?: string
  pageSize?: string
  category?: string
  q?: string
  sort?: string
}

function parseListQuery(query: ListQuery, defaultPageSize: number, includeArchived: boolean) {
  const sortMap: Record<string, ProductSort> = { name: 'NAME', 'price-asc': 'PRICE_ASC', 'price-desc': 'PRICE_DESC' }
  const page = Math.max(1, Number.parseInt(query.page ?? '', 10) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(query.pageSize ?? '', 10) || defaultPageSize))
  const category =
    PRODUCT_CATEGORIES.find((c) => c.toLowerCase() === query.category?.toLowerCase()) ?? null
  return makeProductQuery({
    page,
    pageSize,
    category: category as ProductCategory | null,
    search: query.q ?? null,
    sort: sortMap[query.sort ?? ''] ?? 'NEWEST',
    includeArchived,
  })
}

function toProductInput(dto: Record<string, unknown>): ProductInput {
  return {
    name: String(dto.name),
    description: String(dto.description),
    priceMinor: Number(dto.priceMinor),
    currency: String(dto.currency),
    stock: Number(dto.stock),
    category: dto.category as ProductCategory,
    imageUrl: (dto.imageUrl as string | null | undefined) ?? null,
  }
}

export function productRoutes(app: FastifyInstance, catalog: CatalogUseCases): void {
  app.get('/products', { schema: lenientQuerySchema(opSchema('/products', 'get')) }, async (request) =>
    toListResponse(await catalog.listProducts(parseListQuery(request.query as ListQuery, 12, false))),
  )

  app.get(
    fastifyPath('/products/{id}'),
    { schema: opSchema('/products/{id}', 'get') },
    async (request) => {
      const { id } = request.params as { id: string }
      return toProductResponse(await catalog.getProduct(productIdFrom(id)))
    },
  )
}

export function adminProductRoutes(app: FastifyInstance, catalog: CatalogUseCases, tokens: TokenService): void {
  // Reads are open to the demo viewer; every mutation stays ADMIN-only.
  app.get(
    '/admin/products',
    { schema: lenientQuerySchema(opSchema('/admin/products', 'get')), preHandler: requireAnyRole(tokens, 'ADMIN', 'VIEWER') },
    async (request) => toListResponse(await catalog.listProducts(parseListQuery(request.query as ListQuery, 25, true))),
  )

  app.post(
    '/admin/products',
    { schema: opSchema('/admin/products', 'post'), preHandler: requireAnyRole(tokens, 'ADMIN') },
    async (request, reply) => {
      const product = await catalog.createProduct(toProductInput(request.body as Record<string, unknown>))
      return reply.status(201).send(toProductResponse(product))
    },
  )

  app.put(
    fastifyPath('/admin/products/{id}'),
    { schema: opSchema('/admin/products/{id}', 'put'), preHandler: requireAnyRole(tokens, 'ADMIN') },
    async (request) => {
      const { id } = request.params as { id: string }
      return toProductResponse(
        await catalog.updateProduct(productIdFrom(id), toProductInput(request.body as Record<string, unknown>)),
      )
    },
  )

  app.put(
    fastifyPath('/admin/products/{id}/archive'),
    { schema: opSchema('/admin/products/{id}/archive', 'put'), preHandler: requireAnyRole(tokens, 'ADMIN') },
    async (request) => {
      const { id } = request.params as { id: string }
      const { archived } = request.body as { archived: boolean }
      return toProductResponse(await catalog.setProductArchived(productIdFrom(id), archived))
    },
  )
}
