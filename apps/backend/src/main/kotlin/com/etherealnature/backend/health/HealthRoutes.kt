package com.etherealnature.backend.health

import io.github.smiley4.ktoropenapi.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import javax.sql.DataSource
import kotlinx.serialization.Serializable
import org.koin.ktor.ext.inject

@Serializable
data class HealthResponse(val status: String, val database: String)

fun Route.healthRoutes() {
    val dataSource by inject<DataSource>()

    get("health", {
        operationId = "getHealth"
        summary = "Service health"
        description = "Reports service liveness and database connectivity."
        response {
            HttpStatusCode.OK to {
                description = "Service is healthy"
                body<HealthResponse>()
            }
        }
    }) {
        val databaseUp = runCatching {
            dataSource.connection.use { it.prepareStatement("select 1").execute() }
        }.isSuccess

        call.respond(HealthResponse(status = "ok", database = if (databaseUp) "up" else "down"))
    }
}
