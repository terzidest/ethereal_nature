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
import io.ktor.server.config.MapApplicationConfig
import io.ktor.server.config.mergeWith
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

class DemoLoginTest {

    @Test
    fun `demo login issues a working viewer token`() = testApplication {
        loadConfiguredApp()

        val response = client.post("/auth/demo")
        assertEquals(HttpStatusCode.OK, response.status)
        val auth = response.json()
        val token = auth["token"]!!.jsonPrimitive.content
        assertTrue(token.isNotBlank())
        assertEquals("VIEWER", auth["user"]!!.jsonObject["role"]!!.jsonPrimitive.content)

        // The token is a real session.
        val me = client.get("/auth/me") { header(HttpHeaders.Authorization, "Bearer $token") }
        assertEquals(HttpStatusCode.OK, me.status)
        assertEquals("VIEWER", me.json()["role"]!!.jsonPrimitive.content)
    }

    @Test
    fun `viewer cannot list user accounts`() = testApplication {
        loadConfiguredApp()
        val token = client.post("/auth/demo").json()["token"]!!.jsonPrimitive.content

        val users = client.get("/auth/users") { header(HttpHeaders.Authorization, "Bearer $token") }
        assertEquals(HttpStatusCode.Forbidden, users.status)
    }

    @Test
    fun `disabled demo mode means no endpoint and no seeded viewer`() = testApplication {
        // A fresh viewer email proves bootstrap skipped seeding (the dev-default
        // viewer may already exist in a shared local database from enabled runs).
        val freshEmail = "viewer-disabled-${System.nanoTime()}@ethereal.dev"
        environment {
            config = ApplicationConfig("application.conf").mergeWith(
                MapApplicationConfig(
                    "demo.loginEnabled" to "false",
                    "demo.viewerEmail" to freshEmail,
                ),
            )
        }

        assertEquals(HttpStatusCode.NotFound, client.post("/auth/demo").status)

        val login = client.post("/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"$freshEmail","password":"viewer-dev-password"}""")
        }
        assertEquals(HttpStatusCode.Unauthorized, login.status)
    }
}
