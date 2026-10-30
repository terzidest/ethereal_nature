import bcrypt from 'bcryptjs'
import type { AmbientTransactions } from '../platform/db/transaction.js'
import type { TokenService } from '../platform/security.js'
import { parseEmail, parsePasswordHash, type RawPassword, type Role, type User } from './domain.js'
import type { PasswordHasher, TokenIssuer, UserRepository } from './ports.js'

/** Kysely adapter — persistence shape (snake_case rows) mapped to domain explicitly. */
export function kyselyUserRepository(tx: AmbientTransactions): UserRepository {
  return {
    async findByEmail(email) {
      const row = await tx
        .getExecutor()
        .selectFrom('users')
        .selectAll()
        .where('email', '=', email.toLowerCase())
        .executeTakeFirst()
      return row ? toUser(row) : null
    },
    async findById(id) {
      const row = await tx.getExecutor().selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst()
      return row ? toUser(row) : null
    },
    async findAll() {
      const rows = await tx.getExecutor().selectFrom('users').selectAll().orderBy('created_at').execute()
      return rows.map(toUser)
    },
    async insert(user) {
      await tx
        .getExecutor()
        .insertInto('users')
        .values({
          id: user.id,
          email: user.email.toLowerCase(),
          password_hash: user.passwordHash,
          role: user.role,
        })
        .execute()
    },
  }
}

function toUser(row: { id: string; email: string; password_hash: string; role: string }): User {
  return {
    id: row.id,
    email: parseEmail(row.email),
    passwordHash: parsePasswordHash(row.password_hash),
    role: row.role as Role,
  }
}

/**
 * bcrypt compatibility: the Kotlin backend wrote $2a$ cost-12 hashes
 * (at.favre.lib bcrypt); bcryptjs verifies $2a/$2b interchangeably and both
 * backends verify each other's hashes during coexistence.
 */
export function bcryptPasswordHasher(): PasswordHasher {
  return {
    async hash(password: RawPassword) {
      return parsePasswordHash(await bcrypt.hash(password, 12))
    },
    verify(password: RawPassword, hash) {
      return bcrypt.compare(password, hash)
    },
  }
}

/** Adapter over the platform JWT service — writes the exact Kotlin claim set. */
export function jwtTokenIssuer(tokens: TokenService): TokenIssuer {
  return {
    issue(user: User) {
      return tokens.issue({ sub: user.id, email: user.email, role: user.role })
    },
  }
}
