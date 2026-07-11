package com.etherealnature.backend.payments.application

import com.etherealnature.backend.payments.domain.PaymentIntent
import com.etherealnature.backend.payments.domain.PaymentIntentId
import com.etherealnature.backend.payments.domain.PaymentIntentStatus
import com.etherealnature.backend.payments.domain.PaymentsError
import com.etherealnature.backend.payments.domain.WebhookSignature
import java.time.Instant
import kotlin.uuid.Uuid
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

sealed interface CreateIntentOutcome {
    val intent: PaymentIntent

    data class Created(override val intent: PaymentIntent) : CreateIntentOutcome
    data class Existing(override val intent: PaymentIntent) : CreateIntentOutcome
}

class CreatePaymentIntent(
    private val orders: OrderGateway,
    private val intents: PaymentIntentRepository,
    private val tx: TransactionRunner,
) {
    /**
     * Idempotent for open intents: a second call for the same order returns the
     * existing CREATED intent instead of minting a duplicate (a partial unique
     * index backs this at the DB level). Amount is copied from the order.
     */
    operator fun invoke(orderId: Uuid, userId: Uuid): CreateIntentOutcome = tx.run {
        val order = orders.findOwnedOrder(orderId, userId)
            ?: throw PaymentsError.PayableOrderNotFound(orderId)
        if (!order.isPlaced) throw PaymentsError.OrderNotPayable(orderId)
        intents.findOpenByOrder(orderId)?.let { return@run CreateIntentOutcome.Existing(it) }
        val intent = PaymentIntent(
            id = PaymentIntentId(Uuid.random()),
            orderId = orderId,
            userId = userId,
            amountMinor = order.totalMinor,
            currency = order.currency,
            status = PaymentIntentStatus.CREATED,
            createdAt = Instant.now(),
        )
        intents.insert(intent)
        CreateIntentOutcome.Created(intent)
    }
}

class GetPaymentIntent(
    private val intents: PaymentIntentRepository,
    private val tx: TransactionRunner,
) {
    /** Owner-only; anyone else gets the same 404 as a missing intent — no id probing. */
    operator fun invoke(id: PaymentIntentId, requesterId: Uuid): PaymentIntent = tx.run {
        val intent = intents.findById(id) ?: throw PaymentsError.IntentNotFound(id)
        if (intent.userId != requesterId) throw PaymentsError.IntentNotFound(id)
        intent
    }
}

@Serializable
enum class PspEventType { PAYMENT_SUCCEEDED, PAYMENT_FAILED }

/**
 * The provider's wire format. Lives in application (not api/) because the
 * signature must be verified over the raw body before any parsing happens.
 */
@Serializable
data class PspEvent(val eventId: String, val intentId: String, val type: PspEventType)

sealed interface WebhookOutcome {
    data object Processed : WebhookOutcome
    data object AlreadyProcessed : WebhookOutcome
}

class HandlePspEvent(
    private val intents: PaymentIntentRepository,
    private val orders: OrderGateway,
    private val settings: PaymentsSettings,
    private val tx: TransactionRunner,
) {
    operator fun invoke(rawBody: String, signatureHex: String?): WebhookOutcome {
        if (!WebhookSignature.verify(settings.webhookSecret, rawBody, signatureHex)) {
            throw PaymentsError.InvalidWebhookSignature()
        }
        val event = runCatching { json.decodeFromString<PspEvent>(rawBody) }
            .getOrElse { throw PaymentsError.MalformedWebhookEvent(it.message ?: "unparseable body") }
        val intentId = PaymentIntentId(
            runCatching { Uuid.parse(event.intentId) }
                .getOrElse { throw PaymentsError.MalformedWebhookEvent("intentId is not a UUID") },
        )
        // One payments transaction wraps both writes. ordering's TransitionOrderStatus
        // opens its own transaction, which JOINS this outer one (Exposed default —
        // useNestedTransactions is not enabled anywhere), so intent and order settle
        // or roll back together. Replays are answered by intent status, not an
        // event log: a terminal intent is a 200 no-op.
        return tx.run {
            val intent = intents.findById(intentId) ?: throw PaymentsError.IntentNotFound(intentId)
            if (intent.status.isTerminal) return@run WebhookOutcome.AlreadyProcessed
            val target = when (event.type) {
                PspEventType.PAYMENT_SUCCEEDED -> PaymentIntentStatus.SUCCEEDED
                PspEventType.PAYMENT_FAILED -> PaymentIntentStatus.FAILED
            }
            val settled = intent.settle(target, event.eventId)
            intents.settle(settled.id, settled.status, event.eventId)
            if (settled.status == PaymentIntentStatus.SUCCEEDED) orders.markPaid(intent.orderId)
            WebhookOutcome.Processed
        }
    }

    private companion object {
        val json = Json { ignoreUnknownKeys = true }
    }
}
