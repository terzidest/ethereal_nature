import { describe, expect, it } from 'vitest'
import { appendEntry, entriesOf, moveEntry, removeEntry, updateEntryProps, type BlockEntry } from './config'

const config: BlockEntry[] = [
  { type: 'hero', props: { title: 'a' } },
  { type: 'productStrip', props: { title: 'b' } },
  { type: 'valueProps' },
]

describe('entriesOf', () => {
  it('reads a valid config and drops malformed entries', () => {
    expect(entriesOf(config)).toEqual(config)
    expect(entriesOf([{ type: 'hero' }, 'junk', { props: {} }, null])).toEqual([{ type: 'hero' }])
  })

  it('is empty for non-arrays', () => {
    expect(entriesOf(undefined)).toEqual([])
    expect(entriesOf({ type: 'hero' })).toEqual([])
  })
})

describe('editing ops are pure and bounds-safe', () => {
  it('moveEntry swaps neighbours and ignores out-of-range moves', () => {
    expect(moveEntry(config, 1, -1).map((e) => e.type)).toEqual(['productStrip', 'hero', 'valueProps'])
    expect(moveEntry(config, 0, -1)).toBe(config)
    expect(moveEntry(config, 2, 1)).toBe(config)
  })

  it('removeEntry and appendEntry', () => {
    expect(removeEntry(config, 1).map((e) => e.type)).toEqual(['hero', 'valueProps'])
    expect(appendEntry(config, { type: 'categoryTiles' })).toHaveLength(4)
  })

  it('updateEntryProps replaces only the targeted entry, keeping id/type', () => {
    const withId: BlockEntry[] = [{ type: 'hero', props: { title: 'a' }, id: 'hero' }]
    expect(updateEntryProps(withId, 0, { title: 'z' })).toEqual([{ type: 'hero', props: { title: 'z' }, id: 'hero' }])
    expect(updateEntryProps(config, 2, { items: [] })[1]).toBe(config[1])
  })
})
