package com.etherealnature.backend.identity

import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
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
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

private suspend fun HttpResponse.json() = Json.parseToJsonElement(bodyAsText()).jsonObject

private suspend fun ApplicationTestBuilder.register(email: String, password: String = "s3cret-pass"): HttpResponse =
    client.post("/auth/register") {
        contentType(ContentType.Application.Json)
        setBody("""{"email":"$email","password":"$password"}""")
    }

private suspend fun ApplicationTestBuilder.login(email: String, password: String): HttpResponse =
    client.post("/auth/login") {
        contentType(ContentType.Application.Json)
        setBody("""{"email":"$email","password":"$password"}""")
    }

class AuthRoutesTest {

    private fun uniqueEmail() = "user-${System.nanoTime()}@example.com"

    @Test
    fun `register then login round-trips, duplicate email is 409`() = testApplication {
        loadConfiguredApp()
        val email = uniqueEmail()

        val registered = register(email)
        assertEquals(HttpStatusCode.Created, registered.status)
        val registeredBody = registered.json()
        assertEquals("CUSTOMER", registeredBody["user"]!!.jsonObject["role"]!!.jsonPrimitive.content)
        assertTrue(registeredBody["token"]!!.jsonPrimitive.content.isNotBlank())

        val duplicate = register(email)
        assertEquals(HttpStatusCode.Conflict, duplicate.status)

        val loggedIn = login(email, "s3cret-pass")
        assertEquals(HttpStatusCode.OK, loggedIn.status)

        val wrongPassword = login(email, "wrong-password")
        assertEquals(HttpStatusCode.Unauthorized, wrongPassword.status)
    }

    @Test
    fun `password and email shapes are validated`() = testApplication {
        loadConfiguredApp()
        assertEquals(HttpStatusCode.BadRequest, register(uniqueEmail(), "short").status)
        assertEquals(HttpStatusCode.BadRequest, register("not-an-email").status)
    }

    @Test
    fun `me requires a token and returns the caller`() = testApplication {
        loadConfiguredApp()
        assertEquals(HttpStatusCode.Unauthorized, client.get("/auth/me").status)

        val email = uniqueEmail()
        val token = register(email).json()["token"]!!.jsonPrimitive.content
        val me = client.get("/auth/me") { header(HttpHeaders.Authorization, "Bearer $token") }
        assertEquals(HttpStatusCode.OK, me.status)
        assertEquals(email, me.json()["email"]!!.jsonPrimitive.content)
    }

    @Test
    fun `admin endpoint enforces role server-side`() = testApplication {
        loadConfiguredApp()
        // Anonymous → 401
        assertEquals(HttpStatusCode.Unauthorized, client.get("/auth/users").status)

        // CUSTOMER → 403
        val customerToken = register(uniqueEmail()).json()["token"]!!.jsonPrimitive.content
        val forbidden = client.get("/auth/users") { header(HttpHeaders.Authorization, "Bearer $customerToken") }
        assertEquals(HttpStatusCode.Forbidden, forbidden.status)

        // Bootstrapped ADMIN → 200
        val adminToken = login("admin@ethereal.dev", "admin-dev-password").json()["token"]!!.jsonPrimitive.content
        val allowed = client.get("/auth/users") { header(HttpHeaders.Authorization, "Bearer $adminToken") }
        assertEquals(HttpStatusCode.OK, allowed.status)
        assertTrue("ADMIN" in allowed.bodyAsText())
    }

    @Test
    fun `tampered token is rejected`() = testApplication {
        loadConfiguredApp()
        val token = register(uniqueEmail()).json()["token"]!!.jsonPrimitive.content
        val tampered = token.dropLast(3) + "abc"
        val response = client.get("/auth/me") { header(HttpHeaders.Authorization, "Bearer $tampered") }
        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
}
