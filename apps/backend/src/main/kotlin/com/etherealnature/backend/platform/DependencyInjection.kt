package com.etherealnature.backend.platform

import com.etherealnature.backend.cart.cartModule
import com.etherealnature.backend.catalog.catalogModule
import com.etherealnature.backend.identity.identityModule
import com.etherealnature.backend.identity.infrastructure.JwtSettings
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.Application
import io.ktor.server.application.install
import javax.sql.DataSource
import org.jetbrains.exposed.v1.jdbc.Database
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin

fun Application.configureDependencyInjection() {
    val config = environment.config

    val platformModule = module {
        single<DataSource> {
            HikariDataSource(
                HikariConfig().apply {
                    jdbcUrl = config.property("database.url").getString()
                    username = config.property("database.user").getString()
                    password = config.property("database.password").getString()
                    maximumPoolSize = 5
                },
            )
        }
        single { Database.connect(get<DataSource>()) }
    }

    val jwtSettings = JwtSettings(
        secret = config.property("jwt.secret").getString(),
        issuer = config.property("jwt.issuer").getString(),
        audience = config.property("jwt.audience").getString(),
        expiresInMinutes = config.property("jwt.expiresInMinutes").getString().toLong(),
    )

    install(Koin) {
        modules(platformModule, catalogModule, identityModule(jwtSettings), cartModule)
    }
}
