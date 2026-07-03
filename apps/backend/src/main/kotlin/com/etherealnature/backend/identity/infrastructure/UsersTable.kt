package com.etherealnature.backend.identity.infrastructure

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.timestamp

object UsersTable : Table("users") {
    val id = uuid("id")
    val email = varchar("email", 254)
    val passwordHash = varchar("password_hash", 100)
    val role = varchar("role", 32)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
