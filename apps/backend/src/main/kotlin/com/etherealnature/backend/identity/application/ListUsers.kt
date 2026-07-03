package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.User

/** Admin-only back-office capability. */
class ListUsers(
    private val users: UserRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(): List<User> = tx.run { users.findAll() }
}
