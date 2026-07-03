package com.etherealnature.backend.identity.domain

import kotlin.uuid.Uuid

@JvmInline
value class UserId(val value: Uuid) {
    override fun toString(): String = value.toString()
}

@JvmInline
value class Email(val value: String) {
    init {
        require(value.matches(Regex("[^@\\s]+@[^@\\s]+\\.[^@\\s]+"))) { "Invalid email address" }
        require(value.length <= 254) { "Email too long" }
    }
}

/** A raw password only exists transiently at the edge; never stored, never logged. */
@JvmInline
value class RawPassword(val value: String) {
    init {
        require(value.length >= 8) { "Password must be at least 8 characters" }
        require(value.length <= 128) { "Password too long" }
    }

    override fun toString(): String = "RawPassword(***)"
}

@JvmInline
value class PasswordHash(val value: String) {
    init {
        require(value.isNotBlank()) { "Password hash cannot be blank" }
    }

    override fun toString(): String = "PasswordHash(***)"
}

enum class Role { CUSTOMER, ADMIN }

data class User(
    val id: UserId,
    val email: Email,
    val passwordHash: PasswordHash,
    val role: Role,
)
