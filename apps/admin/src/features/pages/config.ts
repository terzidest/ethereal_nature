/**
 * Pure editing operations on a page's block config. The shape mirrors the
 * server's structural contract (and blockprint's): an array of
 * `{ type, props?, id? }` entries. Entries whose type the admin build doesn't
 * know are preserved untouched — never dropped or rewritten.
 */
export interface BlockEntry {
  type: string
  props?: unknown
  id?: string | number
}

/** Lenient read of a server config (`unknown` in the contract). */
export function entriesOf(config: unknown): BlockEntry[] {
  if (!Array.isArray(config)) return []
  return config.filter(
    (entry): entry is BlockEntry =>
      typeof entry === 'object' && entry !== null && typeof (entry as BlockEntry).type === 'string',
  )
}

/** Swap an entry with its neighbour; out-of-range moves are no-ops. */
export function moveEntry(entries: BlockEntry[], index: number, delta: -1 | 1): BlockEntry[] {
  const target = index + delta
  const a = entries[index]
  const b = entries[target]
  if (a === undefined || b === undefined) return entries
  const next = [...entries]
  next[index] = b
  next[target] = a
  return next
}

export function removeEntry(entries: BlockEntry[], index: number): BlockEntry[] {
  return entries.filter((_, i) => i !== index)
}

export function updateEntryProps(entries: BlockEntry[], index: number, props: unknown): BlockEntry[] {
  return entries.map((entry, i) => (i === index ? { ...entry, props } : entry))
}

export function appendEntry(entries: BlockEntry[], entry: BlockEntry): BlockEntry[] {
  return [...entries, entry]
}
