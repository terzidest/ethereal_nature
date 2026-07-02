package com.etherealnature.backend

import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.config.ApplicationConfig
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

private fun ApplicationTestBuilder.loadConfiguredApp() {
    environment { config = ApplicationConfig("application.conf") }
}

class HealthTest {

    @Test
    fun `health endpoint responds ok with database up`() = testApplication {
        loadConfiguredApp()
        val response = client.get("/health")
        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.bodyAsText()
        assertTrue("\"status\":\"ok\"" in body, "unexpected body: $body")
        assertTrue("\"database\":\"up\"" in body, "unexpected body: $body")
    }

    @Test
    fun `openapi spec is emitted and covers the health route`() = testApplication {
        loadConfiguredApp()
        val response = client.get("/openapi.json")
        assertEquals(HttpStatusCode.OK, response.status)
        val spec = response.bodyAsText()
        assertTrue("/health" in spec, "spec does not document /health")
        assertTrue("HealthResponse" in spec, "spec does not include the HealthResponse schema")
    }
}
