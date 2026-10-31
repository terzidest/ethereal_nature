import type { FastifyInstance } from 'fastify'
import { fastifyPath, opSchema } from '../platform/contract.js'
import { BadRequestError } from '../platform/errors.js'
import { requireAnyRole, type TokenService } from '../platform/security.js'
import type { Page } from './domain.js'
import type { ContentUseCases } from './use-cases.js'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function slugFrom(raw: string | undefined): string {
  if (!raw || !SLUG_PATTERN.test(raw)) throw new BadRequestError(`Invalid page slug: ${raw}`)
  return raw
}

function toPageResponse(page: Page) {
  return {
    slug: page.slug,
    config: page.config,
    updatedAtEpochSeconds: Math.floor(page.updatedAt.getTime() / 1000),
  }
}

export function contentRoutes(app: FastifyInstance, content: ContentUseCases, tokens: TokenService): void {
  // Public: the storefront renders pages anonymously (home, SSR'd).
  app.get(fastifyPath('/pages/{slug}'), { schema: opSchema('/pages/{slug}', 'get') }, async (request) => {
    const { slug } = request.params as { slug: string }
    return toPageResponse(await content.getPage(slugFrom(slug)))
  })

  // Reads are open to the demo viewer; the mutation stays ADMIN-only.
  app.get(
    '/admin/pages',
    { schema: opSchema('/admin/pages', 'get'), preHandler: requireAnyRole(tokens, 'ADMIN', 'VIEWER') },
    async () => ({
      pages: (await content.listPages()).map((p) => ({
        slug: p.slug,
        updatedAtEpochSeconds: Math.floor(p.updatedAt.getTime() / 1000),
      })),
    }),
  )

  app.put(
    fastifyPath('/admin/pages/{slug}'),
    { schema: opSchema('/admin/pages/{slug}', 'put'), preHandler: requireAnyRole(tokens, 'ADMIN') },
    async (request) => {
      const { slug } = request.params as { slug: string }
      const { config } = request.body as { config: unknown }
      return toPageResponse(await content.updatePage(slugFrom(slug), config))
    },
  )
}
