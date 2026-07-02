package com.etherealnature.backend.platform

import io.github.smiley4.ktoropenapi.OpenApi
import io.github.smiley4.ktoropenapi.config.SchemaGenerator
import io.github.smiley4.schemakenerator.swagger.data.RefType
import io.github.smiley4.schemakenerator.swagger.data.TitleType
import io.ktor.server.application.Application
import io.ktor.server.application.install

fun Application.configureOpenApi() {
    install(OpenApi) {
        info {
            title = "Ethereal Nature API"
            version = "0.1.0"
            description = "Contract source of truth for storefront and admin (ADR-0004)."
        }
        schemas {
            // DTOs are @Serializable — generate schemas from kotlinx.serialization
            // descriptors so the spec matches the actual wire format. Simple names
            // keep the generated TS types clean.
            generator = SchemaGenerator.kotlinx {
                title = TitleType.SIMPLE
                referencePath = RefType.SIMPLE
            }
        }
    }
}
