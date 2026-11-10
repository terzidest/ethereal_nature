import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blockSchemas } from './registry'

/**
 * Seed ↔ registry consistency: every home config a migration writes must
 * validate against the registered block schemas, forever. If a schema evolves
 * non-additively (or a block is renamed), this fails before the live home
 * page silently drops sections to the prod fallback.
 */
type Entry = { type: string; props?: unknown }

const migration = (file: string) =>
  readFileSync(new URL(`../../../../server/migrations/${file}`, import.meta.url), 'utf8')

/** V9 inserts the launch config. */
function v9Config(): Entry[] {
  const json = migration('V9__content_pages.sql').match(/'(\[[\s\S]*\])'::jsonb/)?.[1]
  if (!json) throw new Error('home seed JSON not found in V9 migration')
  return JSON.parse(json)
}

/** V12 swaps in the redesign config (the `set config = …` value; the `where` holds the V9 one). */
function v12Config(): Entry[] {
  const json = migration('V12__home_redesign_content.sql').match(/set config = '(\[[\s\S]*?\])'::jsonb/)?.[1]
  if (!json) throw new Error('home config JSON not found in V12 migration')
  return JSON.parse(json)
}

function expectValid(entries: Entry[]) {
  expect(entries.length).toBeGreaterThan(0)
  for (const entry of entries) {
    const schema = blockSchemas[entry.type as keyof typeof blockSchemas]
    expect(schema, `block type "${entry.type}" is not in the registry`).toBeDefined()
    const result = schema.safeParse(entry.props)
    expect(
      result.success,
      `props for "${entry.type}" fail its schema: ${result.success ? '' : JSON.stringify(result.error.issues)}`,
    ).toBe(true)
  }
}

describe('home configs written by migrations vs block registry', () => {
  it('V9 launch seed still validates (old shapes keep rendering)', () => {
    expectValid(v9Config())
  })

  it('V9 seed covers the four launch blocks', () => {
    expect(v9Config().map((e) => e.type)).toEqual(['hero', 'categoryTiles', 'productStrip', 'valueProps'])
  })

  it('V12 redesign config validates', () => {
    expectValid(v12Config())
  })

  it('V12 follows the spec section order', () => {
    expect(v12Config().map((e) => e.type)).toEqual([
      'hero',
      'uspTicker',
      'categoryTiles',
      'productStrip',
      'valueProps',
      'newsletter',
    ])
  })

  it('V12 only replaces a config that is still the V9 seed', () => {
    const sql = migration('V12__home_redesign_content.sql')
    const guard = sql.match(/and config = '(\[[\s\S]*\])'::jsonb/)?.[1]
    expect(guard && JSON.parse(guard)).toEqual(v9Config())
  })
})
