package com.etherealnature.backend.identity.infrastructure

import com.etherealnature.backend.identity.application.UserRepository
import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.PasswordHash
import com.etherealnature.backend.identity.domain.Role
import com.etherealnature.backend.identity.domain.User
import com.etherealnature.backend.identity.domain.UserId
import java.time.Instant
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll

class ExposedUserRepository : UserRepository {

    override fun findByEmail(email: Email): User? =
        UsersTable.selectAll()
            .where(UsersTable.email eq email.value.lowercase())
            .singleOrNull()
            ?.toUser()

    override fun findById(id: UserId): User? =
        UsersTable.selectAll()
            .where(UsersTable.id eq id.value)
            .singleOrNull()
            ?.toUser()

    override fun findAll(): List<User> =
        UsersTable.selectAll().orderBy(UsersTable.createdAt).map { it.toUser() }

    override fun insert(user: User) {
        UsersTable.insert {
            it[id] = user.id.value
            it[email] = user.email.value.lowercase()
            it[passwordHash] = user.passwordHash.value
            it[role] = user.role.name
            it[createdAt] = Instant.now()
        }
    }

    private fun ResultRow.toUser(): User = User(
        id = UserId(this[UsersTable.id]),
        email = Email(this[UsersTable.email]),
        passwordHash = PasswordHash(this[UsersTable.passwordHash]),
        role = Role.valueOf(this[UsersTable.role]),
    )
}
