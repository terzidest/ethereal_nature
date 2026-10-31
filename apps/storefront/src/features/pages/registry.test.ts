import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blockSchemas } from './registry'

/**
 * Seed ↔ registry consistency: the V9 home seed must validate against the
 * registered block schemas, forever. If a schema evolves non-additively (or a
 * block is renamed), this fails before the live home page silently drops
 * sections to the prod fallback.
 */
const MIGRATION = new URL('../../../../server/migrations/V9__content_pages.sql', import.meta.url)

function seedConfig(): Array<{ type: string; props?: unknown }> {
  const sql = readFileSync(MIGRATION, 'utf8')
  const json = sql.match(/'(\[[\s\S]*\])'::jsonb/)?.[1]
  if (!json) throw new Error('home seed JSON not found in V9 migration')
  return JSON.parse(json)
}

describe('V9 home seed vs block registry', () => {
  it('every seed entry has a registered, passing schema', () => {
    const entries = seedConfig()
    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      const schema = blockSchemas[entry.type as keyof typeof blockSchemas]
      expect(schema, `block type "${entry.type}" is not in the registry`).toBeDefined()
      const result = schema.safeParse(entry.props)
      expect(
        result.success,
        `seed props for "${entry.type}" fail its schema: ${result.success ? '' : JSON.stringify(result.error.issues)}`,
      ).toBe(true)
    }
  })

  it('seed covers the four launch blocks', () => {
    expect(seedConfig().map((e) => e.type)).toEqual(['hero', 'categoryTiles', 'productStrip', 'valueProps'])
  })
})
