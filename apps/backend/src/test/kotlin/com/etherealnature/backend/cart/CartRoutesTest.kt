package com.etherealnature.backend.cart

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
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

// Seeded catalog fixtures (V3 migration)
private const val LAVENDER = "0d9f3f65-1a2b-4c3d-8e4f-000000000001" // price 1450, stock 42
private const val AMETHYST = "0d9f3f65-1a2b-4c3d-8e4f-000000000010" // price 3250, stock 9
private const val ARCHIVED = "0d9f3f65-1a2b-4c3d-8e4f-000000000016" // archived
private const val GHOST = "00000000-0000-0000-0000-000000000404"

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

private suspend fun HttpResponse.json() = Json.parseToJsonElement(bodyAsText()).jsonObject

class CartRoutesTest {

    private suspend fun ApplicationTestBuilder.freshUserToken(): String {
        val response = client.post("/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"cart-${System.nanoTime()}@example.com","password":"s3cret-pass"}""")
        }
        return response.json()["token"]!!.jsonPrimitive.content
    }

    @Test
    fun `cart endpoints require authentication`() = testApplication {
        loadConfiguredApp()
        assertEquals(HttpStatusCode.Unauthorized, client.get("/cart").status)
        assertEquals(
            HttpStatusCode.Unauthorized,
            client.post("/cart/merge") {
                contentType(ContentType.Application.Json)
                setBody("""{"mergeId":"${UUID.randomUUID()}","lines":[]}""")
            }.status,
        )
    }

    @Test
    fun `merge applies sum-then-clamp with adjustments and is idempotent per mergeId`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()
        val mergeId = UUID.randomUUID().toString()

        // Pre-existing server cart: 3 lavender.
        client.put("/cart/items") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody("""{"productId":"$LAVENDER","quantity":3}""")
        }

        val body = """
            {"mergeId":"$mergeId","lines":[
              {"productId":"$LAVENDER","quantity":2,"priceSnapshotMinor":999},
              {"productId":"$AMETHYST","quantity":50},
              {"productId":"$ARCHIVED","quantity":1},
              {"productId":"$GHOST","quantity":1}
            ]}
        """.trimIndent()

        val merge = client.post("/cart/merge") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody(body)
        }
        assertEquals(HttpStatusCode.OK, merge.status)
        val result = merge.json()

        val lines = result["cart"]!!.jsonObject["lines"]!!.jsonArray.associate {
            it.jsonObject["productId"]!!.jsonPrimitive.content to it.jsonObject
        }
        // 3 existing + 2 guest lavender = 5; amethyst clamped to stock 9.
        assertEquals(5, lines[LAVENDER]!!["quantity"]!!.jsonPrimitive.int)
        assertEquals(9, lines[AMETHYST]!!["quantity"]!!.jsonPrimitive.int)
        // Server-side price, not the bogus 999 snapshot.
        assertEquals(1450, lines[LAVENDER]!!["unitPriceMinor"]!!.jsonPrimitive.long)

        val adjustments = result["adjustments"]!!.jsonObject
        assertEquals(2, adjustments["dropped"]!!.jsonArray.size) // archived + ghost
        assertEquals(1, adjustments["clamped"]!!.jsonArray.size)
        val priceChange = adjustments["priceChanged"]!!.jsonArray.single().jsonObject
        assertEquals(999, priceChange["snapshotPriceMinor"]!!.jsonPrimitive.long)
        assertEquals(1450, priceChange["currentPriceMinor"]!!.jsonPrimitive.long)

        // Replay the exact same merge: no quantity doubling, no adjustments.
        val replay = client.post("/cart/merge") {
            header(HttpHeaders.Authorization, "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody(body)
        }.json()
        val replayLines = replay["cart"]!!.jsonObject["lines"]!!.jsonArray.associate {
            it.jsonObject["productId"]!!.jsonPrimitive.content to it.jsonObject
        }
        assertEquals(5, replayLines[LAVENDER]!!["quantity"]!!.jsonPrimitive.int)
        assertTrue(replay["adjustments"]!!.jsonObject["dropped"]!!.jsonArray.isEmpty())
    }

    @Test
    fun `set item upserts, clamps, and removes at zero`() = testApplication {
        loadConfiguredApp()
        val token = freshUserToken()

        suspend fun setItem(productId: String, quantity: Int): HttpResponse =
            client.put("/cart/items") {
                header(HttpHeaders.Authorization, "Bearer $token")
                contentType(ContentType.Application.Json)
                setBody("""{"productId":"$productId","quantity":$quantity}""")
            }

        val added = setItem(AMETHYST, 4).json()
        assertEquals(4, added["lines"]!!.jsonArray.single().jsonObject["quantity"]!!.jsonPrimitive.int)
        assertEquals(4 * 3250L, added["subtotalMinor"]!!.jsonPrimitive.long)

        val clamped = setItem(AMETHYST, 500).json()
        assertEquals(9, clamped["lines"]!!.jsonArray.single().jsonObject["quantity"]!!.jsonPrimitive.int)

        val removed = setItem(AMETHYST, 0).json()
        assertTrue(removed["lines"]!!.jsonArray.isEmpty())

        assertEquals(HttpStatusCode.Conflict, setItem(ARCHIVED, 1).status)
        assertEquals(HttpStatusCode.Conflict, setItem(GHOST, 1).status)
    }
}
