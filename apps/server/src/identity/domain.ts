import { AppError, domainRequire } from '../platform/errors.js'

/**
 * Identity domain — pure, framework-free. Value invariants are enforced by
 * the parse functions (the TS mirror of Kotlin's value-class constructors):
 * invalid values are unrepresentable past this boundary.
 */
export type Role = 'CUSTOMER' | 'ADMIN' | 'VIEWER'

export type Email = string & { readonly __brand: 'Email' }
export type RawPassword = string & { readonly __brand: 'RawPassword' }
export type PasswordHash = string & { readonly __brand: 'PasswordHash' }

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function parseEmail(value: string): Email {
  domainRequire(EMAIL_PATTERN.test(value), 'Invalid email address')
  domainRequire(value.length <= 254, 'Email too long')
  return value as Email
}

/** A raw password only exists transiently at the edge; never stored, never logged. */
export function parseRawPassword(value: string): RawPassword {
  domainRequire(value.length >= 8, 'Password must be at least 8 characters')
  domainRequire(value.length <= 128, 'Password too long')
  return value as RawPassword
}

export function parsePasswordHash(value: string): PasswordHash {
  domainRequire(value.length > 0, 'Password hash cannot be blank')
  return value as PasswordHash
}

export interface User {
  id: string
  email: Email
  passwordHash: PasswordHash
  role: Role
}

/** Sealed domain errors — mapped to HTTP exactly once, by the platform error handler. */
export class EmailAlreadyRegistered extends AppError {
  readonly status = 409
  readonly code = 'EMAIL_ALREADY_REGISTERED'
  constructor() {
    // Deliberately does not echo the email back — it lands in HTTP responses.
    super('This email is already registered')
  }
}

export class InvalidCredentials extends AppError {
  readonly status = 401
  readonly code = 'INVALID_CREDENTIALS'
  constructor() {
    super('Invalid email or password')
  }
}
