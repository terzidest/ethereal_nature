package com.etherealnature.backend.platform

import com.etherealnature.backend.cart.domain.CartError
import com.etherealnature.backend.catalog.domain.CatalogError
import com.etherealnature.backend.identity.domain.IdentityError
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(val code: String, val message: String)

/**
 * The single place domain errors map to HTTP. As contexts land, their sealed
 * error hierarchies get an exception<...> (or result-mapping) entry here —
 * routes never build ad-hoc error responses.
 */
fun Application.configureErrorHandling() {
    install(StatusPages) {
        exception<CatalogError.ProductNotFound> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(code = "PRODUCT_NOT_FOUND", message = cause.message),
            )
        }
        exception<CartError.ProductUnavailable> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                ErrorResponse(code = "PRODUCT_UNAVAILABLE", message = cause.message),
            )
        }
        exception<IdentityError.EmailAlreadyRegistered> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                ErrorResponse(code = "EMAIL_ALREADY_REGISTERED", message = cause.message),
            )
        }
        exception<IdentityError.InvalidCredentials> { call, cause ->
            call.respond(
                HttpStatusCode.Unauthorized,
                ErrorResponse(code = "INVALID_CREDENTIALS", message = cause.message),
            )
        }
        // Domain value objects validate in their constructors (ADR-0005's
        // "invalid-by-construction"); a failed require() at the edge is a 400.
        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(code = "VALIDATION", message = cause.message ?: "Invalid request"),
            )
        }
        exception<BadRequestException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(code = "BAD_REQUEST", message = cause.message ?: "Bad request"),
            )
        }
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(code = "INTERNAL_ERROR", message = "Unexpected server error"),
            )
        }
    }
}
