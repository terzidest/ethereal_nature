package com.etherealnature.backend.platform

import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.routing.RoutingContext
import kotlin.uuid.Uuid

/** The authenticated user's id, for routes inside authenticate(JWT_AUTH). */
fun RoutingContext.authenticatedUserId(): Uuid {
    val subject = call.principal<JWTPrincipal>()?.payload?.subject
        ?: throw BadRequestException("Missing token subject")
    return Uuid.parse(subject)
}
