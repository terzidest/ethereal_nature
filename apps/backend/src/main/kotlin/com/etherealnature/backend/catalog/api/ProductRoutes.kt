package com.etherealnature.backend.catalog.api

import com.etherealnature.backend.catalog.application.GetProduct
import com.etherealnature.backend.catalog.application.ListProducts
import com.etherealnature.backend.catalog.application.ProductQuery
import com.etherealnature.backend.catalog.application.ProductSort
import com.etherealnature.backend.catalog.domain.ProductId
import io.github.smiley4.ktoropenapi.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import kotlin.uuid.Uuid
import org.koin.ktor.ext.inject

fun Route.productRoutes() {
    val listProducts by inject<ListProducts>()
    val getProduct by inject<GetProduct>()

    get("products", {
        operationId = "listProducts"
        summary = "List products"
        description = "Paginated, filterable catalog listing. Archived products are excluded."
        request {
            queryParameter<Int>("page") { description = "1-based page number (default 1)" }
            queryParameter<Int>("pageSize") { description = "Items per page, 1..100 (default 12)" }
            queryParameter<ProductCategoryDto>("category") { description = "Filter by category" }
            queryParameter<String>("q") { description = "Case-insensitive name search" }
            queryParameter<ProductSortDto>("sort") { description = "Sort order (default newest)" }
        }
        response {
            HttpStatusCode.OK to {
                description = "One page of products"
                body<ProductListResponse>()
            }
        }
    }) {
        val params = call.request.queryParameters
        val query = ProductQuery(
            page = (params["page"]?.toIntOrNull() ?: 1).coerceAtLeast(1),
            pageSize = (params["pageSize"]?.toIntOrNull() ?: 12).coerceIn(1, ProductQuery.MAX_PAGE_SIZE),
            category = params["category"]?.let { raw ->
                ProductCategoryDto.entries.find { it.name.equals(raw, ignoreCase = true) }?.toDomain()
            },
            search = params["q"],
            sort = when (params["sort"]) {
                "name" -> ProductSort.NAME
                "price-asc" -> ProductSort.PRICE_ASC
                "price-desc" -> ProductSort.PRICE_DESC
                else -> ProductSort.NEWEST
            },
        )
        call.respond(listProducts(query).toResponse())
    }

    get("products/{id}", {
        operationId = "getProduct"
        summary = "Get a product by id"
        request {
            pathParameter<String>("id") { description = "Product UUID" }
        }
        response {
            HttpStatusCode.OK to {
                description = "The product"
                body<ProductResponse>()
            }
            HttpStatusCode.NotFound to {
                description = "No product with this id"
            }
        }
    }) {
        val raw = call.parameters["id"] ?: throw BadRequestException("Missing product id")
        val id = runCatching { Uuid.parse(raw) }.getOrElse {
            throw BadRequestException("Invalid product id: $raw")
        }
        call.respond(getProduct(ProductId(id)).toResponse())
    }
}
