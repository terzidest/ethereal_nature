package com.etherealnature.backend.payments

import com.etherealnature.backend.payments.domain.WebhookSignature
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.config.ApplicationConfig
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

// Seeded fixtures: forest berry tea (1250, stock 57), lapsang (1850, stock 26).
private const val FOREST_BERRY = "0d9f3f65-1a2b-4c3d-8e4f-000000000014"

// Dev default from application.conf — the config the test app loads.
private const val WEBHOOK_SECRET = "dev-only-webhook-secret-do-not-use-in-production"

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

private suspend fun HttpResponse.json() = Json.parseToJsonElement(bodyAsText()).jsonObject

class PaymentRoutesTest {

    private suspend fun ApplicationTestBuilder.freshUserToken(): String =
        client.post("/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"pay-${System.nanoTime()}@example.com","password":"s3cret-pass"}""")
        }.json()["token"]!!.jsonPrimitive.content

    private suspend fun ApplicationTestBuilder.adminToken(): String =
        client.post("/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"admin@ethereal.dev","password":"admin-dev-password"}""")
        }.json()["token"]!!.jsonPrimitive.content

    private suspend fun ApplicationTestBuilder.placedOrderId(token: String, quantity: Int = 1): String {
        client.put("/cart/items") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"productId":"$FOREST_BERRY","quantity":$quantity}""")
        }
        return client.post("/orders") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"expectedTotalMinor":${quantity * 1250L}}""")
        }.json()["id"]!!.jsonPrimitive.content
    }

    private suspend fun ApplicationTestBuilder.createIntent(token: String, orderId: String): HttpResponse =
        client.post("/payments/intents") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"orderId":"$orderId"}""")
        }

    private suspend fun ApplicationTestBuilder.simulate(token: String, intentId: String, outcome: String): HttpResponse =
        client.post("/mock-psp/intents/$intentId/simulate") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"outcome":"$outcome"}""")
        }

    private suspend fun ApplicationTestBuilder.webhook(body: String, signature: String?): HttpResponse =
        client.post("/payments/webhook") {
            signature?.let { header("X-Webhook-Signature", it) }
            contentType(ContentType.Application.Json)
            setBody(body)
        }

    private suspend fun ApplicationTestBuilder.orderStatus(token: String, orderId: String): String =
        client.get("/orders/$orderId") { header(HttpHeaders.Authorization, "Bearer $token") }
            .json()["status"]!!.jsonPrimitive.content

    @Test
    fun `happy path - place, create intent, pay, order becomes PAID`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token, quantity = 2)

        val created = createIntent(token, orderId)
        assertEquals(HttpStatusCode.Created, created.status)
        val intent = created.json()
        assertEquals(2 * 1250L, intent["amountMinor"]!!.jsonPrimitive.long)
        assertEquals("CREATED", intent["status"]!!.jsonPrimitive.content)
        val intentId = intent["id"]!!.jsonPrimitive.content

        val paid = simulate(token, intentId, "PAY")
        assertEquals(HttpStatusCode.OK, paid.status)
        assertEquals("SUCCEEDED", paid.json()["status"]!!.jsonPrimitive.content)
        assertEquals("PAID", orderStatus(token, orderId))
    }

    @Test
    fun `declined payment leaves the order PLACED and a fresh intent can be created`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token)
        val intentId = createIntent(token, orderId).json()["id"]!!.jsonPrimitive.content

        assertEquals("FAILED", simulate(token, intentId, "DECLINE").json()["status"]!!.jsonPrimitive.content)
        assertEquals("PLACED", orderStatus(token, orderId))

        // FAILED is terminal — retry mints a new intent.
        val retry = createIntent(token, orderId)
        assertEquals(HttpStatusCode.Created, retry.status)
        assertNotEquals(intentId, retry.json()["id"]!!.jsonPrimitive.content)
    }

    @Test
    fun `creating an intent is idempotent while one is open`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token)

        val first = createIntent(token, orderId)
        assertEquals(HttpStatusCode.Created, first.status)
        val second = createIntent(token, orderId)
        assertEquals(HttpStatusCode.OK, second.status)
        assertEquals(
            first.json()["id"]!!.jsonPrimitive.content,
            second.json()["id"]!!.jsonPrimitive.content,
        )
    }

    @Test
    fun `replayed success is a no-op, including a directly posted signed duplicate`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token)
        val intentId = createIntent(token, orderId).json()["id"]!!.jsonPrimitive.content

        assertEquals(HttpStatusCode.OK, simulate(token, intentId, "PAY").status)
        // Simulating again must not 409/500 — the intent is settled, the order PAID.
        assertEquals(HttpStatusCode.OK, simulate(token, intentId, "PAY").status)
        assertEquals("PAID", orderStatus(token, orderId))

        // Same guarantee straight through the public webhook.
        val body = """{"eventId":"replay-1","intentId":"$intentId","type":"PAYMENT_SUCCEEDED"}"""
        val replay = webhook(body, WebhookSignature.sign(WEBHOOK_SECRET, body))
        assertEquals(HttpStatusCode.OK, replay.status)
        assertEquals("already_processed", replay.json()["status"]!!.jsonPrimitive.content)
    }

    @Test
    fun `webhook rejects bad signatures and malformed bodies without touching state`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token)
        val intentId = createIntent(token, orderId).json()["id"]!!.jsonPrimitive.content

        val body = """{"eventId":"e1","intentId":"$intentId","type":"PAYMENT_SUCCEEDED"}"""
        assertEquals(HttpStatusCode.Unauthorized, webhook(body, "deadbeef").status)
        assertEquals(HttpStatusCode.Unauthorized, webhook(body, null).status)

        val garbage = """{"nope":true}"""
        assertEquals(
            HttpStatusCode.BadRequest,
            webhook(garbage, WebhookSignature.sign(WEBHOOK_SECRET, garbage)).status,
        )

        // Nothing happened.
        assertEquals("PLACED", orderStatus(token, orderId))
        val intent = client.get("/payments/intents/$intentId") {
            header(HttpHeaders.Authorization, "Bearer $token")
        }.json()
        assertEquals("CREATED", intent["status"]!!.jsonPrimitive.content)
    }

    @Test
    fun `payment intents are private`() = testApplication {
        loadConfiguredApp()
        val owner = freshUserToken()
        val orderId = placedOrderId(owner)
        val intentId = createIntent(owner, orderId).json()["id"]!!.jsonPrimitive.content

        val other = freshUserToken()
        // Another user cannot create an intent for someone else's order...
        assertEquals(HttpStatusCode.NotFound, createIntent(other, orderId).status)
        // ...nor read or settle someone else's intent.
        val read = client.get("/payments/intents/$intentId") { header(HttpHeaders.Authorization, "Bearer $other") }
        assertEquals(HttpStatusCode.NotFound, read.status)
        assertEquals(HttpStatusCode.NotFound, simulate(other, intentId, "PAY").status)
    }

    @Test
    fun `an already paid order is not payable again`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token)
        val intentId = createIntent(token, orderId).json()["id"]!!.jsonPrimitive.content
        simulate(token, intentId, "PAY")

        val again = createIntent(token, orderId)
        assertEquals(HttpStatusCode.Conflict, again.status)
        assertTrue("ORDER_NOT_PAYABLE" in again.bodyAsText())
    }

    @Test
    fun `admin race - webhook success after manual PAID transition stays a no-op for the order`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val orderId = placedOrderId(token)
        val intentId = createIntent(token, orderId).json()["id"]!!.jsonPrimitive.content

        // Admin marks the order PAID first (manual fallback still exists).
        val admin = adminToken()
        client.post("/admin/orders/$orderId/status") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody("""{"status":"PAID"}""")
        }

        // The webhook must still settle the intent without erroring.
        val paid = simulate(token, intentId, "PAY")
        assertEquals(HttpStatusCode.OK, paid.status)
        assertEquals("SUCCEEDED", paid.json()["status"]!!.jsonPrimitive.content)
        assertEquals("PAID", orderStatus(token, orderId))
    }
}
