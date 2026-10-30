import type { Email, PasswordHash, RawPassword, Role, User } from './domain.js'

/** Ports owned by the identity application layer; adapters live in infrastructure. */

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>
  findById(id: string): Promise<User | null>
  findAll(): Promise<User[]>
  insert(user: User): Promise<void>
}

export interface PasswordHasher {
  hash(password: RawPassword): Promise<PasswordHash>
  verify(password: RawPassword, hash: PasswordHash): Promise<boolean>
}

export interface IssuedToken {
  token: string
  expiresAtEpochSeconds: number
}

export interface TokenIssuer {
  issue(user: User): Promise<IssuedToken>
}

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>
}

export interface DemoSettings {
  viewerEmail: string
  viewerPassword: string
  loginEnabled: boolean
}

export type { Role }
