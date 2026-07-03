package com.etherealnature.backend.identity.domain

/** Sealed domain errors — mapped to HTTP exactly once, in StatusPages. */
sealed class IdentityError : Exception() {
    class EmailAlreadyRegistered(val email: Email) : IdentityError() {
        // Deliberately does not echo the email back — it lands in HTTP responses.
        override val message: String get() = "This email is already registered"
    }

    class InvalidCredentials : IdentityError() {
        override val message: String get() = "Invalid email or password"
    }
}
