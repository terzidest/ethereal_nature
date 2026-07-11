package com.etherealnature.backend.payments

import com.etherealnature.backend.payments.domain.PaymentIntent
import com.etherealnature.backend.payments.domain.PaymentIntentId
import com.etherealnature.backend.payments.domain.PaymentIntentStatus
import com.etherealnature.backend.payments.domain.WebhookSignature
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.uuid.Uuid

private fun intent(status: PaymentIntentStatus = PaymentIntentStatus.CREATED) = PaymentIntent(
    id = PaymentIntentId(Uuid.random()),
    orderId = Uuid.random(),
    userId = Uuid.random(),
    amountMinor = 1250,
    currency = "EUR",
    status = status,
    createdAt = Instant.parse("2026-07-11T10:00:00Z"),
)

class PaymentIntentTest {

    @Test
    fun `settling an open intent reaches the terminal status and records the event`() {
        val settled = intent().settle(PaymentIntentStatus.SUCCEEDED, eventId = "evt-1")
        assertEquals(PaymentIntentStatus.SUCCEEDED, settled.status)
        assertEquals("evt-1", settled.settledEventId)
        assertTrue(settled.status.isTerminal)
    }

    @Test
    fun `an intent can be declined`() {
        assertEquals(PaymentIntentStatus.FAILED, intent().settle(PaymentIntentStatus.FAILED, "evt-2").status)
    }

    @Test
    fun `terminal intents are frozen`() {
        assertFailsWith<IllegalArgumentException> {
            intent(PaymentIntentStatus.SUCCEEDED).settle(PaymentIntentStatus.FAILED, "evt-3")
        }
        assertFailsWith<IllegalArgumentException> {
            intent(PaymentIntentStatus.FAILED).settle(PaymentIntentStatus.SUCCEEDED, "evt-4")
        }
    }

    @Test
    fun `settling to CREATED is not a settlement`() {
        assertFailsWith<IllegalArgumentException> {
            intent().settle(PaymentIntentStatus.CREATED, "evt-5")
        }
    }

    @Test
    fun `invalid amounts and currencies are unconstructible`() {
        assertFailsWith<IllegalArgumentException> { intent().copy(amountMinor = -1) }
        assertFailsWith<IllegalArgumentException> { intent().copy(currency = "EURO") }
    }
}

class WebhookSignatureTest {

    private val secret = "test-secret"
    private val payload = """{"eventId":"e1","intentId":"i1","type":"PAYMENT_SUCCEEDED"}"""

    @Test
    fun `sign and verify round trip`() {
        assertTrue(WebhookSignature.verify(secret, payload, WebhookSignature.sign(secret, payload)))
    }

    @Test
    fun `tampered payload fails verification`() {
        val signature = WebhookSignature.sign(secret, payload)
        assertFalse(WebhookSignature.verify(secret, payload.replace("SUCCEEDED", "FAILED"), signature))
    }

    @Test
    fun `wrong secret fails verification`() {
        assertFalse(WebhookSignature.verify("other-secret", payload, WebhookSignature.sign(secret, payload)))
    }

    @Test
    fun `missing or malformed signatures fail without throwing`() {
        assertFalse(WebhookSignature.verify(secret, payload, null))
        assertFalse(WebhookSignature.verify(secret, payload, ""))
        assertFalse(WebhookSignature.verify(secret, payload, "not-hex"))
        assertFalse(WebhookSignature.verify(secret, payload, "abc")) // odd length
    }
}
