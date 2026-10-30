/**
 * Kysely table types for the existing schema (migrations V1–V8). Column names
 * are the snake_case DB names; repositories map to domain shapes explicitly —
 * persistence shape and domain shape stay separate (backend CLAUDE.md).
 * Grows context by context as the port proceeds.
 */
import type { Generated } from 'kysely'

export interface DB {
  flyway_schema_history: FlywaySchemaHistoryTable
  users: UsersTable
  products: ProductsTable
  carts: CartsTable
  cart_lines: CartLinesTable
}

export interface CartsTable {
  user_id: string
  last_merge_id: string | null
  updated_at: Generated<Date>
}

export interface CartLinesTable {
  user_id: string
  product_id: string
  quantity: number
  position: number
}

export interface ProductsTable {
  id: string
  slug: string
  name: string
  description: string
  price_minor: number
  currency: string
  stock: number
  category: string
  image_url: string | null
  archived: boolean
  created_at: Generated<Date>
}

export interface UsersTable {
  id: string
  email: string
  password_hash: string
  role: string
  created_at: Generated<Date>
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
