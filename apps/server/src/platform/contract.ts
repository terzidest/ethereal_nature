import spec from '@ethereal-nature/api-client/openapi.json' with { type: 'json' }
import type { FastifyInstance, FastifySchema } from 'fastify'

/**
 * The committed openapi.json IS the contract — and here, the runtime source
 * of truth. Routes derive their validation/serialization schemas from it, and
 * /openapi.json serves it verbatim, so regenerating the client against this
 * server reproduces the committed client byte-for-byte (ADR-0010). Nothing in
 * this app re-derives or re-emits the spec.
 */

type Spec = typeof spec
type SpecPaths = Spec['paths']

interface OperationObject {
  operationId?: string
  parameters?: Array<{
    name: string
    in: 'query' | 'path' | 'header'
    required?: boolean
    schema?: unknown
  }>
  requestBody?: { content?: { 'application/json'?: { schema?: unknown } } }
  responses?: Record<string, { content?: { 'application/json'?: { schema?: unknown } } }>
}

/** `#/components/schemas/X` → `X#` (fastify's own shared-schema ref form). */
function rewriteRefs<T>(node: T): T {
  if (Array.isArray(node)) return node.map(rewriteRefs) as T
  if (node !== null && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) {
      out[key] =
        key === '$ref' && typeof value === 'string' && value.startsWith('#/components/schemas/')
          ? `${value.slice('#/components/schemas/'.length)}#`
          : rewriteRefs(value)
    }
    return out as T
  }
  return node
}

/** Register every component schema on the instance so `X#` refs resolve. */
export function registerContractSchemas(app: FastifyInstance): void {
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    app.addSchema({ $id: name, ...rewriteRefs(schema as Record<string, unknown>) })
  }
}

/** Derive a Fastify route schema from the spec operation — never hand-write DTO schemas. */
export function opSchema(path: keyof SpecPaths, method: 'get' | 'post' | 'put'): FastifySchema {
  const op = (spec.paths[path] as Record<string, unknown>)[method] as OperationObject | undefined
  if (!op) throw new Error(`No ${method.toUpperCase()} ${String(path)} in the OpenAPI contract`)

  const schema: FastifySchema = {}

  const body = op.requestBody?.content?.['application/json']?.schema
  if (body) schema.body = rewriteRefs(body)

  for (const location of ['query', 'path', 'header'] as const) {
    const params = (op.parameters ?? []).filter((p) => p.in === location)
    if (params.length === 0) continue
    const objectSchema = {
      type: 'object',
      properties: Object.fromEntries(params.map((p) => [p.name, rewriteRefs(p.schema ?? {})])),
      required: params.filter((p) => p.required).map((p) => p.name),
    }
    if (location === 'query') schema.querystring = objectSchema
    if (location === 'path') schema.params = objectSchema
    if (location === 'header') schema.headers = { ...objectSchema, required: [] }
  }

  // Only codes with a JSON body: bodyless 401/404/… stay with the error handler.
  const response: Record<string, unknown> = {}
  for (const [code, res] of Object.entries(op.responses ?? {})) {
    const resSchema = res.content?.['application/json']?.schema
    if (resSchema) response[code] = rewriteRefs(resSchema)
  }
  if (Object.keys(response).length > 0) schema.response = response

  return schema
}

/** Spec paths use `{id}`; Fastify wants `:id`. */
export function fastifyPath(path: keyof SpecPaths): string {
  return String(path).replace(/\{(\w+)\}/g, ':$1')
}

/**
 * Serve the contract verbatim, minus conditionally-registered operations when
 * their flags are off (mirrors Ktor registering those routes conditionally).
 */
export function contractDocument(flags: { demoLoginEnabled: boolean; mockPspEnabled: boolean }): object {
  const doc = JSON.parse(JSON.stringify(spec)) as { paths: Record<string, unknown> }
  if (!flags.demoLoginEnabled) delete doc.paths['/auth/demo']
  if (!flags.mockPspEnabled) delete doc.paths['/mock-psp/intents/{id}/simulate']
  return doc
}

export { spec as contractSpec }
