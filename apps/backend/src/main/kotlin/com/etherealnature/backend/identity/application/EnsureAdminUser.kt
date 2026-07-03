package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.RawPassword
import com.etherealnature.backend.identity.domain.Role
import com.etherealnature.backend.identity.domain.User
import com.etherealnature.backend.identity.domain.UserId
import kotlin.uuid.Uuid

/**
 * Startup bootstrap: guarantees one ADMIN account from configuration.
 * Avoids baking a password hash into a migration.
 */
class EnsureAdminUser(
    private val users: UserRepository,
    private val hasher: PasswordHasher,
    private val tx: TransactionRunner,
) {
    operator fun invoke(email: Email, password: RawPassword) {
        val hash = hasher.hash(password)
        tx.run {
            if (users.findByEmail(email) == null) {
                users.insert(User(id = UserId(Uuid.random()), email = email, passwordHash = hash, role = Role.ADMIN))
            }
        }
    }
}
