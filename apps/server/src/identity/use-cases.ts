import { randomUUID } from 'node:crypto'
import {
  EmailAlreadyRegistered,
  InvalidCredentials,
  parseEmail,
  type Email,
  type RawPassword,
  type Role,
  type User,
} from './domain.js'
import type { DemoSettings, IssuedToken, PasswordHasher, TokenIssuer, TransactionRunner, UserRepository } from './ports.js'

export interface IdentityDeps {
  users: UserRepository
  hasher: PasswordHasher
  tokens: TokenIssuer
  tx: TransactionRunner
  demo: DemoSettings
}

export interface AuthResult {
  user: User
  token: IssuedToken
}

export function identityUseCases({ users, hasher, tokens, tx, demo }: IdentityDeps) {
  return {
    /** Registers a CUSTOMER and signs them in (returns user + token). */
    async registerUser(email: Email, password: RawPassword): Promise<AuthResult> {
      // Hash outside the transaction — bcrypt is deliberately slow.
      const passwordHash = await hasher.hash(password)
      const user = await tx.run(async () => {
        if (await users.findByEmail(email)) throw new EmailAlreadyRegistered()
        const created: User = { id: randomUUID(), email, passwordHash, role: 'CUSTOMER' }
        await users.insert(created)
        return created
      })
      return { user, token: await tokens.issue(user) }
    },

    async authenticateUser(email: Email, password: RawPassword): Promise<AuthResult> {
      const user = await tx.run(() => users.findByEmail(email))
      if (!user) throw new InvalidCredentials()
      // Same error for unknown email and wrong password — no account probing.
      if (!(await hasher.verify(password, user.passwordHash))) throw new InvalidCredentials()
      return { user, token: await tokens.issue(user) }
    },

    /** A valid token for a since-deleted user is treated as invalid credentials. */
    async getUser(id: string): Promise<User> {
      const user = await tx.run(() => users.findById(id))
      if (!user) throw new InvalidCredentials()
      return user
    },

    /** Admin-only back-office capability. */
    async listUsers(): Promise<User[]> {
      return tx.run(() => users.findAll())
    },

    /**
     * Startup bootstrap: guarantees one account with the given role from
     * configuration. Avoids baking a password hash into a migration.
     */
    async ensureSeedUser(email: Email, password: RawPassword, role: Role): Promise<void> {
      const passwordHash = await hasher.hash(password)
      await tx.run(async () => {
        if (!(await users.findByEmail(email))) {
          await users.insert({ id: randomUUID(), email, passwordHash, role })
        }
      })
    },

    /**
     * One-click demo sign-in: issues a token for the seeded viewer account.
     * The route only exists when demo mode is enabled, and enabling it is
     * what seeds the account at boot — a missing viewer is a boot invariant
     * breach, not a handled case.
     */
    async demoLogin(): Promise<AuthResult> {
      const user = await tx.run(() => users.findByEmail(parseEmail(demo.viewerEmail)))
      if (!user) throw new Error('Demo viewer account missing — bootstrap must run before routes are served')
      return { user, token: await tokens.issue(user) }
    },
  }
}

export type IdentityUseCases = ReturnType<typeof identityUseCases>
