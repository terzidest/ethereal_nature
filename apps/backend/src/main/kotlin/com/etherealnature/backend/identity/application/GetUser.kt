package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.IdentityError
import com.etherealnature.backend.identity.domain.User
import com.etherealnature.backend.identity.domain.UserId

class GetUser(
    private val users: UserRepository,
    private val tx: TransactionRunner,
) {
    /** A valid token for a since-deleted user is treated as invalid credentials. */
    operator fun invoke(id: UserId): User =
        tx.run { users.findById(id) } ?: throw IdentityError.InvalidCredentials()
}
