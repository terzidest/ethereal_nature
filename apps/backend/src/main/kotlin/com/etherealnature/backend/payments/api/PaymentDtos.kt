package com.etherealnature.backend.payments.api

import com.etherealnature.backend.payments.domain.PaymentIntent
import kotlinx.serialization.Serializable

@Serializable
enum class PaymentIntentStatusDto { CREATED, SUCCEEDED, FAILED }

@Serializable
data class PaymentIntentResponse(
    val id: String,
    val orderId: String,
    val amountMinor: Long,
    val currency: String,
    val status: PaymentIntentStatusDto,
    val createdAtEpochSeconds: Long,
)

@Serializable
data class CreatePaymentIntentRequest(val orderId: String)

@Serializable
enum class SimulatedOutcomeDto { PAY, DECLINE }

@Serializable
data class SimulatePaymentRequest(val outcome: SimulatedOutcomeDto)

@Serializable
data class WebhookAckResponse(val status: String)

fun PaymentIntent.toResponse() = PaymentIntentResponse(
    id = id.toString(),
    orderId = orderId.toString(),
    amountMinor = amountMinor,
    currency = currency,
    status = PaymentIntentStatusDto.valueOf(status.name),
    createdAtEpochSeconds = createdAt.epochSecond,
)
