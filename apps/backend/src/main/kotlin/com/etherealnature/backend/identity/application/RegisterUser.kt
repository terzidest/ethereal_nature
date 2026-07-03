package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.IdentityError
import com.etherealnature.backend.identity.domain.RawPassword
import com.etherealnature.backend.identity.domain.Role
import com.etherealnature.backend.identity.domain.User
import com.etherealnature.backend.identity.domain.UserId
import kotlin.uuid.Uuid

class RegisterUser(
    private val users: UserRepository,
    private val hasher: PasswordHasher,
    private val tokens: TokenIssuer,
    private val tx: TransactionRunner,
) {
    /** Registers a CUSTOMER and signs them in (returns user + token). */
    operator fun invoke(email: Email, password: RawPassword): Pair<User, IssuedToken> {
        // Hash outside the transaction — bcrypt is deliberately slow.
        val hash = hasher.hash(password)
        val user = tx.run {
            if (users.findByEmail(email) != null) throw IdentityError.EmailAlreadyRegistered(email)
            User(id = UserId(Uuid.random()), email = email, passwordHash = hash, role = Role.CUSTOMER)
                .also(users::insert)
        }
        return user to tokens.issue(user)
    }
}
