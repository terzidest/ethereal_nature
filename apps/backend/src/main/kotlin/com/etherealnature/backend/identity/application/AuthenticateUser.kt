package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.IdentityError
import com.etherealnature.backend.identity.domain.RawPassword
import com.etherealnature.backend.identity.domain.User

class AuthenticateUser(
    private val users: UserRepository,
    private val hasher: PasswordHasher,
    private val tokens: TokenIssuer,
    private val tx: TransactionRunner,
) {
    operator fun invoke(email: Email, password: RawPassword): Pair<User, IssuedToken> {
        val user = tx.run { users.findByEmail(email) }
            ?: throw IdentityError.InvalidCredentials()
        // Same error for unknown email and wrong password — no account probing.
        if (!hasher.verify(password, user.passwordHash)) throw IdentityError.InvalidCredentials()
        return user to tokens.issue(user)
    }
}
