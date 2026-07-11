package com.etherealnature.backend.platform

import com.etherealnature.backend.cart.domain.CartError
import com.etherealnature.backend.catalog.domain.CatalogError
import com.etherealnature.backend.identity.domain.IdentityError
import com.etherealnature.backend.ordering.domain.OrderingError
import com.etherealnature.backend.payments.domain.PaymentsError
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
        exception<OrderingError.EmptyCart> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(code = "EMPTY_CART", message = cause.message),
            )
        }
        exception<OrderingError.OrderNotFound> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(code = "ORDER_NOT_FOUND", message = cause.message),
            )
        }
        exception<OrderingError.InvalidStatusTransition> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                ErrorResponse(code = "INVALID_STATUS_TRANSITION", message = cause.message),
            )
        }
        exception<PaymentsError.IntentNotFound> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(code = "PAYMENT_INTENT_NOT_FOUND", message = cause.message),
            )
        }
        exception<PaymentsError.PayableOrderNotFound> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(code = "ORDER_NOT_FOUND", message = cause.message),
            )
        }
        exception<PaymentsError.OrderNotPayable> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                ErrorResponse(code = "ORDER_NOT_PAYABLE", message = cause.message),
            )
        }
        exception<PaymentsError.InvalidWebhookSignature> { call, cause ->
            call.respond(
                HttpStatusCode.Unauthorized,
                ErrorResponse(code = "INVALID_WEBHOOK_SIGNATURE", message = cause.message),
            )
        }
        exception<PaymentsError.MalformedWebhookEvent> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(code = "MALFORMED_WEBHOOK_EVENT", message = cause.message),
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
