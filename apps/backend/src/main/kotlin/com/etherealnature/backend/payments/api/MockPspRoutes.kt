package com.etherealnature.backend.payments.api

import com.etherealnature.backend.payments.application.GetPaymentIntent
import com.etherealnature.backend.payments.application.HandlePspEvent
import com.etherealnature.backend.payments.application.PaymentsSettings
import com.etherealnature.backend.payments.application.PspEvent
import com.etherealnature.backend.payments.application.PspEventType
import com.etherealnature.backend.payments.domain.WebhookSignature
import com.etherealnature.backend.platform.JWT_AUTH
import com.etherealnature.backend.platform.authenticatedUserId
import io.github.smiley4.ktoropenapi.post
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import kotlin.uuid.Uuid
import kotlinx.serialization.json.Json
import org.koin.ktor.ext.inject

/**
 * Stand-in for the payment provider, registered only when payments.mockPspEnabled.
 * It builds the provider event, signs it with the shared secret, and pushes it
 * through the same HandlePspEvent path the public webhook uses — a real
 * sign→verify round trip, in-process.
 */
fun Route.mockPspRoutes() {
    val getPaymentIntent by inject<GetPaymentIntent>()
    val handlePspEvent by inject<HandlePspEvent>()
    val settings by inject<PaymentsSettings>()

    authenticate(JWT_AUTH) {
        post("mock-psp/intents/{id}/simulate", {
            operationId = "simulatePayment"
            summary = "Simulate the payment provider settling an intent (dev only)"
            description = "Emits a signed PAYMENT_SUCCEEDED or PAYMENT_FAILED event for your own " +
                "intent through the webhook pipeline. An already-settled intent is a no-op."
            request {
                pathParameter<String>("id") { description = "Payment intent UUID" }
                body<SimulatePaymentRequest>()
            }
            response {
                HttpStatusCode.OK to {
                    description = "The intent after the simulated outcome"
                    body<PaymentIntentResponse>()
                }
                HttpStatusCode.NotFound to { description = "No such intent (or not yours)" }
                HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
            }
        }) {
            val dto = call.receive<SimulatePaymentRequest>()
            val intentId = intentIdFrom(call.parameters["id"])
            val userId = authenticatedUserId()
            getPaymentIntent(intentId, userId) // ownership gate — 404s for anyone else's intent

            val event = PspEvent(
                eventId = Uuid.random().toString(),
                intentId = intentId.toString(),
                type = when (dto.outcome) {
                    SimulatedOutcomeDto.PAY -> PspEventType.PAYMENT_SUCCEEDED
                    SimulatedOutcomeDto.DECLINE -> PspEventType.PAYMENT_FAILED
                },
            )
            val body = Json.encodeToString(PspEvent.serializer(), event)
            handlePspEvent(body, WebhookSignature.sign(settings.webhookSecret, body))

            call.respond(getPaymentIntent(intentId, userId).toResponse())
        }
    }
}
