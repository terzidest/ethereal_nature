/**
 * Kysely table types for the existing schema (migrations V1–V8). Column names
 * are the snake_case DB names; repositories map to domain shapes explicitly —
 * persistence shape and domain shape stay separate (backend CLAUDE.md).
 * Grows context by context as the port proceeds.
 */
import type { Generated } from 'kysely'

export interface DB {
  flyway_schema_history: FlywaySchemaHistoryTable
}

export interface FlywaySchemaHistoryTable {
  installed_rank: number
  version: string | null
  description: string
  type: string
  script: string
  checksum: number | null
  installed_by: string
  installed_on: Generated<Date>
  execution_time: number
  success: boolean
}
