package com.etherealnature.backend.identity.api

import com.etherealnature.backend.identity.application.AuthenticateUser
import com.etherealnature.backend.identity.application.GetUser
import com.etherealnature.backend.identity.application.ListUsers
import com.etherealnature.backend.identity.application.RegisterUser
import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.RawPassword
import com.etherealnature.backend.identity.domain.Role
import com.etherealnature.backend.identity.domain.UserId
import com.etherealnature.backend.platform.JWT_AUTH
import com.etherealnature.backend.platform.requireRole
import io.github.smiley4.ktoropenapi.get
import io.github.smiley4.ktoropenapi.post
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.RoutingContext
import io.ktor.server.routing.route
import kotlin.uuid.Uuid
import org.koin.ktor.ext.inject

fun Route.authRoutes() {
    val registerUser by inject<RegisterUser>()
    val authenticateUser by inject<AuthenticateUser>()
    val getUser by inject<GetUser>()
    val listUsers by inject<ListUsers>()

    route("auth") {
        post("register", {
            operationId = "register"
            summary = "Register a new customer account"
            request { body<RegisterRequest>() }
            response {
                HttpStatusCode.Created to {
                    description = "Account created and signed in"
                    body<AuthResponse>()
                }
                HttpStatusCode.Conflict to { description = "Email already registered" }
                HttpStatusCode.BadRequest to { description = "Invalid email or password shape" }
            }
        }) {
            val dto = call.receive<RegisterRequest>()
            val (user, token) = registerUser(Email(dto.email), RawPassword(dto.password))
            call.respond(HttpStatusCode.Created, authResponse(user, token))
        }

        post("login", {
            operationId = "login"
            summary = "Sign in with email and password"
            request { body<LoginRequest>() }
            response {
                HttpStatusCode.OK to {
                    description = "Signed in"
                    body<AuthResponse>()
                }
                HttpStatusCode.Unauthorized to { description = "Invalid credentials" }
            }
        }) {
            val dto = call.receive<LoginRequest>()
            val (user, token) = authenticateUser(Email(dto.email), RawPassword(dto.password))
            call.respond(authResponse(user, token))
        }

        authenticate(JWT_AUTH) {
            get("me", {
                operationId = "getCurrentUser"
                summary = "The authenticated user"
                response {
                    HttpStatusCode.OK to {
                        description = "Current user"
                        body<UserResponse>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                call.respond(getUser(currentUserId()).toResponse())
            }
        }

        requireRole(Role.ADMIN.name) {
            get("users", {
                operationId = "listUsers"
                summary = "All user accounts (admin only)"
                response {
                    HttpStatusCode.OK to {
                        description = "All users"
                        body<UserListResponse>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                call.respond(UserListResponse(listUsers().map { it.toResponse() }))
            }
        }
    }
}

private fun RoutingContext.currentUserId(): UserId {
    val subject = call.principal<JWTPrincipal>()?.payload?.subject
        ?: throw BadRequestException("Missing token subject")
    return UserId(Uuid.parse(subject))
}
