package com.etherealnature.backend.catalog

import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
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

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

class ProductRoutesTest {

    @Test
    fun `lists seeded products with pagination`() = testApplication {
        loadConfiguredApp()
        val response = client.get("/products?pageSize=5")
        assertEquals(HttpStatusCode.OK, response.status)
        val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
        assertEquals(5, body["items"]!!.jsonArray.size)
        assertEquals(1, body["page"]!!.jsonPrimitive.int)
        assertTrue(body["totalItems"]!!.jsonPrimitive.int >= 15, "expected seeded catalog")
    }

    @Test
    fun `filters by category and search, excludes archived`() = testApplication {
        loadConfiguredApp()
        val teas = Json.parseToJsonElement(client.get("/products?category=TEAS").bodyAsText()).jsonObject
        val names = teas["items"]!!.jsonArray.map { it.jsonObject["name"]!!.jsonPrimitive.content }
        assertTrue(names.isNotEmpty())
        assertTrue(names.none { "Discontinued" in it }, "archived product leaked: $names")

        val search = Json.parseToJsonElement(client.get("/products?q=lavender").bodyAsText()).jsonObject
        val found = search["items"]!!.jsonArray.map { it.jsonObject["slug"]!!.jsonPrimitive.content }
        assertEquals(listOf("lavender-essential-oil"), found)
    }

    @Test
    fun `sorts by price ascending`() = testApplication {
        loadConfiguredApp()
        val body = Json.parseToJsonElement(client.get("/products?sort=price-asc&pageSize=100").bodyAsText()).jsonObject
        val prices = body["items"]!!.jsonArray.map { it.jsonObject["priceMinor"]!!.jsonPrimitive.int }
        assertEquals(prices.sorted(), prices)
    }

    @Test
    fun `returns a single product by id`() = testApplication {
        loadConfiguredApp()
        val response = client.get("/products/0d9f3f65-1a2b-4c3d-8e4f-000000000001")
        assertEquals(HttpStatusCode.OK, response.status)
        assertTrue("lavender-essential-oil" in response.bodyAsText())
    }

    @Test
    fun `unknown id is 404, malformed id is 400`() = testApplication {
        loadConfiguredApp()
        val missing = client.get("/products/00000000-0000-0000-0000-999999999999")
        assertEquals(HttpStatusCode.NotFound, missing.status)
        assertTrue("PRODUCT_NOT_FOUND" in missing.bodyAsText())

        val malformed = client.get("/products/not-a-uuid")
        assertEquals(HttpStatusCode.BadRequest, malformed.status)
    }
}
