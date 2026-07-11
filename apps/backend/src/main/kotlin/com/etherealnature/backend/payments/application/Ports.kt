package com.etherealnature.backend.payments.application

import com.etherealnature.backend.payments.domain.PaymentIntent
import com.etherealnature.backend.payments.domain.PaymentIntentId
import com.etherealnature.backend.payments.domain.PaymentIntentStatus
import kotlin.uuid.Uuid

/** The slice of an order that payments needs — payments' own vocabulary, not ordering's. */
data class PayableOrder(
    val orderId: Uuid,
    val userId: Uuid,
    val totalMinor: Long,
    val currency: String,
    val isPlaced: Boolean,
)

interface OrderGateway {
    /** null when the order doesn't exist or isn't the requester's — the caller 404s either way. */
    fun findOwnedOrder(orderId: Uuid, requesterId: Uuid): PayableOrder?

    /** Idempotent: an order already at or past PAID is left untouched. */
    fun markPaid(orderId: Uuid)
}

interface PaymentIntentRepository {
    fun insert(intent: PaymentIntent)
    fun findById(id: PaymentIntentId): PaymentIntent?
    fun findOpenByOrder(orderId: Uuid): PaymentIntent?
    fun settle(id: PaymentIntentId, status: PaymentIntentStatus, eventId: String)
}

interface TransactionRunner {
    fun <T> run(block: () -> T): T
}

data class PaymentsSettings(
    val webhookSecret: String,
    val mockPspEnabled: Boolean,
)
