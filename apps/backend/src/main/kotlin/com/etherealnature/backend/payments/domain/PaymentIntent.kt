package com.etherealnature.backend.payments.domain

import java.time.Instant
import kotlin.uuid.Uuid

@JvmInline
value class PaymentIntentId(val value: Uuid) {
    override fun toString(): String = value.toString()
}

/** CREATED is the only open state; settling to SUCCEEDED or FAILED is the only transition. */
enum class PaymentIntentStatus {
    CREATED, SUCCEEDED, FAILED;

    val isTerminal: Boolean get() = this != CREATED
}

/**
 * One attempt to pay one order. Amount and currency are copied from the order
 * server-side at creation — never client-supplied. Terminal intents are frozen;
 * retrying a failed payment means creating a new intent.
 */
data class PaymentIntent(
    val id: PaymentIntentId,
    val orderId: Uuid,
    val userId: Uuid,
    val amountMinor: Long,
    val currency: String,
    val status: PaymentIntentStatus,
    val createdAt: Instant,
    val settledEventId: String? = null,
) {
    init {
        require(amountMinor >= 0) { "Payment amount cannot be negative" }
        require(currency.length == 3) { "Currency must be a 3-letter code" }
    }

    fun settle(target: PaymentIntentStatus, eventId: String): PaymentIntent {
        require(!status.isTerminal) { "Payment intent $id is already settled" }
        require(target.isTerminal) { "Settling must reach a terminal status" }
        return copy(status = target, settledEventId = eventId)
    }
}
