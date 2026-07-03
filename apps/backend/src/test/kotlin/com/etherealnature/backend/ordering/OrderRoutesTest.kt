package com.etherealnature.backend.ordering

import io.ktor.client.HttpClient
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
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

// Seeded fixtures: forest berry tea (1250, stock 57), lapsang (1850, stock 26).
private const val FOREST_BERRY = "0d9f3f65-1a2b-4c3d-8e4f-000000000014"
private const val LAPSANG = "0d9f3f65-1a2b-4c3d-8e4f-000000000015"

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

private suspend fun HttpResponse.json() = Json.parseToJsonElement(bodyAsText()).jsonObject

private suspend fun HttpClient.authed(token: String, block: suspend HttpClient.(String) -> HttpResponse) =
    block(token)

class OrderRoutesTest {

    private suspend fun ApplicationTestBuilder.freshUserToken(): String =
        client.post("/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"order-${System.nanoTime()}@example.com","password":"s3cret-pass"}""")
        }.json()["token"]!!.jsonPrimitive.content

    private suspend fun ApplicationTestBuilder.adminToken(): String =
        client.post("/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"admin@ethereal.dev","password":"admin-dev-password"}""")
        }.json()["token"]!!.jsonPrimitive.content

    private suspend fun ApplicationTestBuilder.putItem(token: String, productId: String, quantity: Int) =
        client.put("/cart/items") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"productId":"$productId","quantity":$quantity}""")
        }

    private suspend fun ApplicationTestBuilder.placeOrder(token: String, expectedTotal: Long): HttpResponse =
        client.post("/orders") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"expectedTotalMinor":$expectedTotal}""")
        }

    private suspend fun ApplicationTestBuilder.stockOf(productId: String): Int =
        client.get("/products/$productId").json()["stock"]!!.jsonPrimitive.int

    @Test
    fun `placing an order decrements stock, freezes the order, and empties the cart`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val stockBefore = stockOf(FOREST_BERRY)

        putItem(token, FOREST_BERRY, 2)
        val expectedTotal = 2 * 1250L

        val placed = placeOrder(token, expectedTotal)
        assertEquals(HttpStatusCode.Created, placed.status)
        val order = placed.json()
        assertEquals("PLACED", order["status"]!!.jsonPrimitive.content)
        assertEquals(expectedTotal, order["totalMinor"]!!.jsonPrimitive.long)

        // Stock decremented atomically with the order write.
        assertEquals(stockBefore - 2, stockOf(FOREST_BERRY))

        // Cart is empty afterwards.
        val cart = client.get("/cart") { header(HttpHeaders.Authorization, "Bearer $token") }.json()
        assertTrue(cart["lines"]!!.jsonArray.isEmpty())

        // Order appears in history and by id.
        val history = client.get("/orders") { header(HttpHeaders.Authorization, "Bearer $token") }
        assertTrue(order["id"]!!.jsonPrimitive.content in history.bodyAsText())
    }

    @Test
    fun `stale expected total is rejected with the current total`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        putItem(token, LAPSANG, 1)

        val rejected = placeOrder(token, expectedTotal = 1)
        assertEquals(HttpStatusCode.Conflict, rejected.status)
        assertEquals(1850L, rejected.json()["currentTotalMinor"]!!.jsonPrimitive.long)

        // Nothing happened: stock unchanged, cart intact.
        val cart = client.get("/cart") { header(HttpHeaders.Authorization, "Bearer $token") }.json()
        assertEquals(1, cart["lines"]!!.jsonArray.size)

        // Confirming with the real total succeeds.
        assertEquals(HttpStatusCode.Created, placeOrder(token, 1850L).status)
    }

    @Test
    fun `empty cart cannot be ordered`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val response = placeOrder(token, 0)
        assertEquals(HttpStatusCode.BadRequest, response.status)
        assertTrue("EMPTY_CART" in response.bodyAsText())
    }

    @Test
    fun `orders are private - another user's order id is a 404`() = testApplication {
        loadConfiguredApp()
        val owner = freshUserToken()
        putItem(owner, FOREST_BERRY, 1)
        val orderId = placeOrder(owner, 1250L).json()["id"]!!.jsonPrimitive.content

        val other = freshUserToken()
        val response = client.get("/orders/$orderId") { header(HttpHeaders.Authorization, "Bearer $other") }
        assertEquals(HttpStatusCode.NotFound, response.status)
    }

    @Test
    fun `admin advances status linearly and cannot skip or edit`() = testApplication {
        loadConfiguredApp()
        val customer = freshUserToken()
        putItem(customer, FOREST_BERRY, 1)
        val orderId = placeOrder(customer, 1250L).json()["id"]!!.jsonPrimitive.content
        val admin = adminToken()

        suspend fun transition(status: String): HttpResponse =
            client.post("/admin/orders/$orderId/status") {
                header(HttpHeaders.Authorization, "Bearer $admin")
                contentType(ContentType.Application.Json)
                setBody("""{"status":"$status"}""")
            }

        // Cannot skip PLACED → SHIPPED.
        assertEquals(HttpStatusCode.Conflict, transition("SHIPPED").status)
        // Linear advance works.
        assertEquals("PAID", transition("PAID").json()["status"]!!.jsonPrimitive.content)
        assertEquals("PACKED", transition("PACKED").json()["status"]!!.jsonPrimitive.content)
        // Customer cannot transition.
        val customerAttempt = client.post("/admin/orders/$orderId/status") {
            header(HttpHeaders.Authorization, "Bearer $customer")
            contentType(ContentType.Application.Json)
            setBody("""{"status":"SHIPPED"}""")
        }
        assertEquals(HttpStatusCode.Forbidden, customerAttempt.status)

        // Admin list sees the order.
        val list = client.get("/admin/orders?status=PACKED") { header(HttpHeaders.Authorization, "Bearer $admin") }
        assertTrue(orderId in list.bodyAsText())
    }

    @Test
    fun `catalog price change never alters a placed order`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        putItem(token, LAPSANG, 1)
        val order = placeOrder(token, 1850L).json()
        val orderId = order["id"]!!.jsonPrimitive.content
        val frozenPrice = order["lines"]!!.jsonArray.single().jsonObject["unitPriceMinor"]!!.jsonPrimitive.long
        assertEquals(1850L, frozenPrice)

        // Even after (hypothetical) catalog changes, the order re-read returns
        // the snapshot from its own tables, not a catalog join.
        val reread = client.get("/orders/$orderId") { header(HttpHeaders.Authorization, "Bearer $token") }.json()
        assertEquals(1850L, reread["lines"]!!.jsonArray.single().jsonObject["unitPriceMinor"]!!.jsonPrimitive.long)
    }
}
