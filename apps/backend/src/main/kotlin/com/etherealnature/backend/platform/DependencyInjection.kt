package com.etherealnature.backend.platform

import com.etherealnature.backend.catalog.catalogModule
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

    install(Koin) {
        modules(platformModule, catalogModule)
    }
}
