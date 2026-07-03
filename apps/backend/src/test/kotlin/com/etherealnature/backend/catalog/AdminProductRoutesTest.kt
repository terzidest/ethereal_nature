package com.etherealnature.backend.catalog

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
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

private suspend fun HttpResponse.json() = Json.parseToJsonElement(bodyAsText()).jsonObject

class AdminProductRoutesTest {

    private suspend fun ApplicationTestBuilder.adminToken(): String =
        client.post("/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"admin@ethereal.dev","password":"admin-dev-password"}""")
        }.json()["token"]!!.jsonPrimitive.content

    private suspend fun ApplicationTestBuilder.customerToken(): String =
        client.post("/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"adm-${System.nanoTime()}@example.com","password":"s3cret-pass"}""")
        }.json()["token"]!!.jsonPrimitive.content

    private fun productBody(name: String, priceMinor: Long = 1200, stock: Int = 7) = """
        {"name":"$name","description":"A test product.","priceMinor":$priceMinor,
         "currency":"EUR","stock":$stock,"category":"HERBS"}
    """.trimIndent()

    @Test
    fun `create, edit, and archive lifecycle with public visibility rules`() = testApplication {
        loadConfiguredApp()
        val admin = adminToken()
        val name = "Test Herb ${System.nanoTime()}"

        // Create
        val created = client.post("/admin/products") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody(productBody(name))
        }
        assertEquals(HttpStatusCode.Created, created.status)
        val product = created.json()
        val id = product["id"]!!.jsonPrimitive.content
        assertTrue(product["slug"]!!.jsonPrimitive.content.startsWith("test-herb-"))

        // Visible publicly
        assertTrue(name in client.get("/products?q=test+herb&pageSize=100").bodyAsText())

        // Edit price + stock
        val updated = client.put("/admin/products/$id") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody(productBody(name, priceMinor = 1550, stock = 3))
        }.json()
        assertEquals(1550, updated["priceMinor"]!!.jsonPrimitive.long)

        // Archive → gone from public list, still in admin list, flagged
        client.put("/admin/products/$id/archive") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody("""{"archived":true}""")
        }
        assertFalse(name in client.get("/products?q=test+herb&pageSize=100").bodyAsText())
        val adminList = client.get("/admin/products?q=test+herb&pageSize=100") {
            header(HttpHeaders.Authorization, "Bearer $admin")
        }.json()
        val row = adminList["items"]!!.jsonArray.map { it.jsonObject }
            .first { it["id"]!!.jsonPrimitive.content == id }
        assertTrue(row["archived"]!!.jsonPrimitive.boolean)

        // Restore
        val restored = client.put("/admin/products/$id/archive") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody("""{"archived":false}""")
        }.json()
        assertFalse(restored["archived"]!!.jsonPrimitive.boolean)
    }

    @Test
    fun `validation failures surface as 400 and writes are admin-only`() = testApplication {
        loadConfiguredApp()
        val admin = adminToken()

        val negativePrice = client.post("/admin/products") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody(productBody("Bad Product", priceMinor = -5))
        }
        assertEquals(HttpStatusCode.BadRequest, negativePrice.status)
        assertTrue("VALIDATION" in negativePrice.bodyAsText())

        val customer = customerToken()
        val forbidden = client.post("/admin/products") {
            header(HttpHeaders.Authorization, "Bearer $customer")
            contentType(ContentType.Application.Json)
            setBody(productBody("Sneaky Product"))
        }
        assertEquals(HttpStatusCode.Forbidden, forbidden.status)
    }

    @Test
    fun `price change never alters an existing order snapshot`() = testApplication {
        loadConfiguredApp()
        val admin = adminToken()
        val customer = customerToken()

        // Admin creates a product; customer orders it at 2000.
        val productId = client.post("/admin/products") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody(productBody("Snapshot Sage ${System.nanoTime()}", priceMinor = 2000, stock = 10))
        }.json()["id"]!!.jsonPrimitive.content

        client.put("/cart/items") {
            header(HttpHeaders.Authorization, "Bearer $customer")
            contentType(ContentType.Application.Json)
            setBody("""{"productId":"$productId","quantity":1}""")
        }
        val orderId = client.post("/orders") {
            header(HttpHeaders.Authorization, "Bearer $customer")
            contentType(ContentType.Application.Json)
            setBody("""{"expectedTotalMinor":2000}""")
        }.json()["id"]!!.jsonPrimitive.content

        // Admin doubles the price afterwards.
        client.put("/admin/products/$productId") {
            header(HttpHeaders.Authorization, "Bearer $admin")
            contentType(ContentType.Application.Json)
            setBody(productBody("Snapshot Sage renamed", priceMinor = 4000, stock = 9))
        }

        // The order still shows the price at purchase time.
        val order = client.get("/orders/$orderId") {
            header(HttpHeaders.Authorization, "Bearer $customer")
        }.json()
        val line = order["lines"]!!.jsonArray.single().jsonObject
        assertEquals(2000, line["unitPriceMinor"]!!.jsonPrimitive.long)
        assertEquals(2000, order["totalMinor"]!!.jsonPrimitive.long)
        assertTrue("Snapshot Sage" in line["name"]!!.jsonPrimitive.content)
    }
}
