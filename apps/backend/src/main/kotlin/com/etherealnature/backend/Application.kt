package com.etherealnature.backend

import com.etherealnature.backend.cart.api.cartRoutes
import com.etherealnature.backend.catalog.api.adminProductRoutes
import com.etherealnature.backend.catalog.api.productRoutes
import com.etherealnature.backend.health.healthRoutes
import com.etherealnature.backend.identity.api.authRoutes
import com.etherealnature.backend.identity.api.demoAuthRoutes
import com.etherealnature.backend.identity.application.DemoSettings
import com.etherealnature.backend.identity.application.EnsureSeedUser
import com.etherealnature.backend.identity.domain.Role
import com.etherealnature.backend.ordering.api.orderRoutes
import com.etherealnature.backend.payments.api.mockPspRoutes
import com.etherealnature.backend.payments.api.paymentRoutes
import com.etherealnature.backend.payments.application.PaymentsSettings
import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.RawPassword
import com.etherealnature.backend.platform.configureAuthentication
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
import org.koin.ktor.ext.inject

fun main(args: Array<String>) = EngineMain.main(args)

fun Application.module() {
    configureDependencyInjection()
    configureDatabase()
    configureCors()
    configureSerialization()
    configureErrorHandling()
    configureAuthentication()
    configureOpenApi()
    bootstrapSeedUsers()

    routing {
        route("openapi.json") { openApi() }
        healthRoutes()
        productRoutes()
        authRoutes()
        cartRoutes()
        orderRoutes()
        adminProductRoutes()
        paymentRoutes()
        val paymentsSettings by inject<PaymentsSettings>()
        if (paymentsSettings.mockPspEnabled) mockPspRoutes()
        val demoSettings by inject<DemoSettings>()
        if (demoSettings.loginEnabled) demoAuthRoutes()
    }
}

private fun Application.bootstrapSeedUsers() {
    val ensureSeedUser by inject<EnsureSeedUser>()
    ensureSeedUser(
        Email(environment.config.property("admin.email").getString()),
        RawPassword(environment.config.property("admin.password").getString()),
        Role.ADMIN,
    )
    // The viewer only exists where the demo endpoint does — never seed a
    // known-password account in an environment that didn't opt in.
    val demoSettings by inject<DemoSettings>()
    if (demoSettings.loginEnabled) {
        ensureSeedUser(Email(demoSettings.viewerEmail), RawPassword(demoSettings.viewerPassword), Role.VIEWER)
    }
}
