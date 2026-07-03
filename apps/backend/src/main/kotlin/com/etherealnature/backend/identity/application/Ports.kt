package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.PasswordHash
import com.etherealnature.backend.identity.domain.RawPassword
import com.etherealnature.backend.identity.domain.User
import com.etherealnature.backend.identity.domain.UserId

/** Ports owned by the identity application layer; adapters live in infrastructure. */

interface UserRepository {
    fun findByEmail(email: Email): User?
    fun findById(id: UserId): User?
    fun findAll(): List<User>
    fun insert(user: User)
}

interface PasswordHasher {
    fun hash(password: RawPassword): PasswordHash
    fun verify(password: RawPassword, hash: PasswordHash): Boolean
}

interface TokenIssuer {
    fun issue(user: User): IssuedToken
}

data class IssuedToken(val token: String, val expiresAtEpochSeconds: Long)

interface TransactionRunner {
    fun <T> run(block: () -> T): T
}
