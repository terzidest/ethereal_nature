package com.etherealnature.backend

import com.etherealnature.backend.catalog.api.productRoutes
import com.etherealnature.backend.health.healthRoutes
import com.etherealnature.backend.platform.configureCors
import com.etherealnature.backend.platform.configureDatabase
import com.etherealnature.backend.platform.configureDependencyInjection
import com.etherealnature.backend.platform.configureErrorHandling
import com.etherealnature.backend.platform.configureOpenApi
import com.etherealnature.backend.platform.configureSerialization
import io.github.smiley4.ktoropenapi.openApi
import io.ktor.server.application.Application
import io.ktor.server.netty.EngineMain
import io.ktor.server.routing.route
import io.ktor.server.routing.routing

fun main(args: Array<String>) = EngineMain.main(args)

fun Application.module() {
    configureDependencyInjection()
    configureDatabase()
    configureCors()
    configureSerialization()
    configureErrorHandling()
    configureOpenApi()

    routing {
        route("openapi.json") { openApi() }
        healthRoutes()
        productRoutes()
    }
}
