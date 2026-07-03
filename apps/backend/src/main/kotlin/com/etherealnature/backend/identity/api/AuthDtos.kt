package com.etherealnature.backend.identity.api

import com.etherealnature.backend.identity.application.IssuedToken
import com.etherealnature.backend.identity.domain.Role
import com.etherealnature.backend.identity.domain.User
import kotlinx.serialization.Serializable

@Serializable
enum class RoleDto {
    CUSTOMER, ADMIN;

    companion object {
        fun from(role: Role): RoleDto = valueOf(role.name)
    }
}

@Serializable
data class RegisterRequest(val email: String, val password: String)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class UserResponse(val id: String, val email: String, val role: RoleDto)

@Serializable
data class AuthResponse(val token: String, val expiresAtEpochSeconds: Long, val user: UserResponse)

@Serializable
data class UserListResponse(val users: List<UserResponse>)

fun User.toResponse(): UserResponse =
    UserResponse(id = id.toString(), email = email.value, role = RoleDto.from(role))

fun authResponse(user: User, token: IssuedToken): AuthResponse =
    AuthResponse(token = token.token, expiresAtEpochSeconds = token.expiresAtEpochSeconds, user = user.toResponse())
