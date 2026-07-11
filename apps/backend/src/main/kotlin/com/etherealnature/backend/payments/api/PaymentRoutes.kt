package com.etherealnature.backend.payments.api

import com.etherealnature.backend.payments.application.CreateIntentOutcome
import com.etherealnature.backend.payments.application.CreatePaymentIntent
import com.etherealnature.backend.payments.application.GetPaymentIntent
import com.etherealnature.backend.payments.application.HandlePspEvent
import com.etherealnature.backend.payments.application.WebhookOutcome
import com.etherealnature.backend.payments.domain.PaymentIntentId
import com.etherealnature.backend.platform.JWT_AUTH
import com.etherealnature.backend.platform.authenticatedUserId
import io.github.smiley4.ktoropenapi.get
import io.github.smiley4.ktoropenapi.post
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.request.receive
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.route
import kotlin.uuid.Uuid
import org.koin.ktor.ext.inject

internal fun intentIdFrom(raw: String?): PaymentIntentId =
    PaymentIntentId(
        runCatching { Uuid.parse(raw ?: throw BadRequestException("Missing intent id")) }
            .getOrElse { throw BadRequestException("Invalid intent id: $raw") },
    )

private fun orderUuidFrom(raw: String): Uuid =
    runCatching { Uuid.parse(raw) }
        .getOrElse { throw BadRequestException("Invalid order id: $raw") }

fun Route.paymentRoutes() {
    val createPaymentIntent by inject<CreatePaymentIntent>()
    val getPaymentIntent by inject<GetPaymentIntent>()
    val handlePspEvent by inject<HandlePspEvent>()

    authenticate(JWT_AUTH) {
        route("payments/intents") {
            post({
                operationId = "createPaymentIntent"
                summary = "Create (or return the open) payment intent for one of your orders"
                description = "Amount and currency are copied from the order server-side. " +
                    "Idempotent while an intent is open: a repeat call returns the existing " +
                    "CREATED intent (200) instead of minting a new one (201)."
                request { body<CreatePaymentIntentRequest>() }
                response {
                    HttpStatusCode.Created to {
                        description = "A new payment intent"
                        body<PaymentIntentResponse>()
                    }
                    HttpStatusCode.OK to {
                        description = "The already-open intent for this order"
                        body<PaymentIntentResponse>()
                    }
                    HttpStatusCode.Conflict to { description = "Order is not awaiting payment" }
                    HttpStatusCode.NotFound to { description = "No such order (or not yours)" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                val dto = call.receive<CreatePaymentIntentRequest>()
                when (val outcome = createPaymentIntent(orderUuidFrom(dto.orderId), authenticatedUserId())) {
                    is CreateIntentOutcome.Created ->
                        call.respond(HttpStatusCode.Created, outcome.intent.toResponse())
                    is CreateIntentOutcome.Existing ->
                        call.respond(HttpStatusCode.OK, outcome.intent.toResponse())
                }
            }

            get("{id}", {
                operationId = "getPaymentIntent"
                summary = "A single payment intent (owner only)"
                request { pathParameter<String>("id") { description = "Payment intent UUID" } }
                response {
                    HttpStatusCode.OK to {
                        description = "The payment intent"
                        body<PaymentIntentResponse>()
                    }
                    HttpStatusCode.NotFound to { description = "No such intent (or not yours)" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                call.respond(
                    getPaymentIntent(intentIdFrom(call.parameters["id"]), authenticatedUserId()).toResponse(),
                )
            }
        }
    }

    post("payments/webhook", {
        operationId = "handlePaymentWebhook"
        summary = "PSP callback (HMAC-signed, not user-facing)"
        description = "Settles a payment intent from a provider event. The X-Webhook-Signature " +
            "header must carry the HMAC-SHA256 of the raw body. Replays of settled events " +
            "are acknowledged with 200 and left as no-ops."
        request {
            headerParameter<String>("X-Webhook-Signature") { description = "HMAC-SHA256 hex of the raw body" }
            body<String>()
        }
        response {
            HttpStatusCode.OK to {
                description = "Event processed (or already processed)"
                body<WebhookAckResponse>()
            }
            HttpStatusCode.Unauthorized to { description = "Missing or invalid signature" }
            HttpStatusCode.BadRequest to { description = "Malformed event payload" }
            HttpStatusCode.NotFound to { description = "Unknown payment intent" }
        }
    }) {
        // Raw body, not receive<T>() — the signature is computed over the exact bytes.
        val rawBody = call.receiveText()
        val outcome = handlePspEvent(rawBody, call.request.headers["X-Webhook-Signature"])
        call.respond(
            WebhookAckResponse(
                status = when (outcome) {
                    WebhookOutcome.Processed -> "processed"
                    WebhookOutcome.AlreadyProcessed -> "already_processed"
                },
            ),
        )
    }
}
