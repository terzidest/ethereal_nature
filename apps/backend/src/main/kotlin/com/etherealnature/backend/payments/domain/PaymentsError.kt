package com.etherealnature.backend.payments.domain

import kotlin.uuid.Uuid

/** Sealed domain errors — mapped to HTTP exactly once, in StatusPages. */
sealed class PaymentsError : Exception() {
    class IntentNotFound(val id: PaymentIntentId) : PaymentsError() {
        override val message: String get() = "Payment intent $id not found"
    }

    class PayableOrderNotFound(val orderId: Uuid) : PaymentsError() {
        override val message: String get() = "Order $orderId not found"
    }

    class OrderNotPayable(val orderId: Uuid) : PaymentsError() {
        override val message: String get() = "Order $orderId is not awaiting payment"
    }

    class InvalidWebhookSignature : PaymentsError() {
        override val message: String get() = "Webhook signature missing or invalid"
    }

    class MalformedWebhookEvent(val detail: String) : PaymentsError() {
        override val message: String get() = "Malformed webhook event: $detail"
    }
}
