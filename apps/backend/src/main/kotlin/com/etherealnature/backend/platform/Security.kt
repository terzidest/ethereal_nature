package com.etherealnature.backend.platform

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.etherealnature.backend.identity.infrastructure.JwtSettings
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.createRouteScopedPlugin
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.AuthenticationChecked
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import org.koin.ktor.ext.inject

const val JWT_AUTH = "auth-jwt"

fun Application.configureAuthentication() {
    val settings by inject<JwtSettings>()

    install(Authentication) {
        jwt(JWT_AUTH) {
            realm = "ethereal-nature"
            verifier(
                JWT.require(Algorithm.HMAC256(settings.secret))
                    .withIssuer(settings.issuer)
                    .withAudience(settings.audience)
                    .build(),
            )
            validate { credential ->
                credential.payload.subject?.let { JWTPrincipal(credential.payload) }
            }
            challenge { _, _ ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    ErrorResponse(code = "UNAUTHORIZED", message = "Missing or invalid token"),
                )
            }
        }
    }
}

private class RoleAuthorizationConfig {
    var requiredRole: String = ""
}

private val RoleAuthorization = createRouteScopedPlugin("RoleAuthorization", ::RoleAuthorizationConfig) {
    val requiredRole = pluginConfig.requiredRole
    on(AuthenticationChecked) { call ->
        val principal = call.principal<JWTPrincipal>() ?: return@on // authenticate {} already challenged
        if (principal.payload.getClaim("role").asString() != requiredRole) {
            call.respond(
                HttpStatusCode.Forbidden,
                ErrorResponse(code = "FORBIDDEN", message = "Requires $requiredRole role"),
            )
        }
    }
}

/** Route-level role guard: authentication + role check, server-enforced. */
fun Route.requireRole(role: String, build: Route.() -> Unit): Route =
    authenticate(JWT_AUTH) {
        install(RoleAuthorization) { requiredRole = role }
        build()
    }
