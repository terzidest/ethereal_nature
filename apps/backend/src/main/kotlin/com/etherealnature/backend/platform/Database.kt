package com.etherealnature.backend.platform

import io.ktor.server.application.Application
import javax.sql.DataSource
import org.flywaydb.core.Flyway
import org.koin.ktor.ext.inject

fun Application.configureDatabase() {
    val dataSource by inject<DataSource>()
    Flyway.configure()
        .dataSource(dataSource)
        .locations("classpath:db/migration")
        .load()
        .migrate()
}
