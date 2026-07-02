package com.etherealnature.backend.platform

import com.etherealnature.backend.catalog.domain.CatalogError
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
