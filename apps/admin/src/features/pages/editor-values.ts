import {
  manifest,
  type KnownBlockType,
  type OutputOf,
} from '@ethereal-nature/blocks-contract'

/**
 * The editor binds to total, output-shaped values (every defaulted field
 * present). Strict leniency policy (ADR-0011 v2): an entry whose props fail
 * its schema is edited from the block's defaults — whole entry, not per
 * field. The storefront keeps its own semantics (invalid block → fallback).
 */

export type KnownBlockProps = { [K in KnownBlockType]: OutputOf<(typeof manifest)[K]> }

const defaultsCache = new Map<KnownBlockType, KnownBlockProps[KnownBlockType]>()

/** A block's defaults, parsed to the total output shape (safe: the contract tests every block's defaults parse). */
export function blockDefaults<T extends KnownBlockType>(type: T): KnownBlockProps[T] {
  let value = defaultsCache.get(type)
  if (value === undefined) {
    const block = manifest[type]
    value = block.schema.parse(block.defaults) as KnownBlockProps[KnownBlockType]
    defaultsCache.set(type, value)
  }
  return value as KnownBlockProps[T]
}

/** Untrusted server props → the typed shape the editor form binds to. */
export function editorValue<T extends KnownBlockType>(type: T, props: unknown): KnownBlockProps[T] {
  const result = manifest[type].schema.safeParse(props)
  return result.success ? (result.data as KnownBlockProps[T]) : blockDefaults(type)
}

/** One-line card summary; invalid props say so instead of pretending. */
export function summarize(type: KnownBlockType, props: unknown): string {
  const result = manifest[type].schema.safeParse(props)
  if (!result.success) return 'Invalid props — editing restores defaults'
  return manifest[type].summary?.(result.data as never) ?? type
}
