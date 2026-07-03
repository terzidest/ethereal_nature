package com.etherealnature.backend.catalog.api

import com.etherealnature.backend.catalog.application.CreateProduct
import com.etherealnature.backend.catalog.application.ListProducts
import com.etherealnature.backend.catalog.application.ProductQuery
import com.etherealnature.backend.catalog.application.ProductSort
import com.etherealnature.backend.catalog.application.SetProductArchived
import com.etherealnature.backend.catalog.application.UpdateProduct
import com.etherealnature.backend.catalog.domain.ProductId
import com.etherealnature.backend.platform.requireRole
import io.github.smiley4.ktoropenapi.get
import io.github.smiley4.ktoropenapi.post
import io.github.smiley4.ktoropenapi.put
import io.ktor.http.HttpStatusCode
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.route
import kotlin.uuid.Uuid
import org.koin.ktor.ext.inject

private fun productIdFrom(raw: String?): ProductId =
    ProductId(
        runCatching { Uuid.parse(raw ?: throw BadRequestException("Missing product id")) }
            .getOrElse { throw BadRequestException("Invalid product id: $raw") },
    )

fun Route.adminProductRoutes() {
    val listProducts by inject<ListProducts>()
    val createProduct by inject<CreateProduct>()
    val updateProduct by inject<UpdateProduct>()
    val setProductArchived by inject<SetProductArchived>()

    requireRole("ADMIN") {
        route("admin/products") {
            get({
                operationId = "listAdminProducts"
                summary = "Catalog listing for the back office — includes archived products"
                request {
                    queryParameter<Int>("page") { description = "1-based page (default 1)" }
                    queryParameter<Int>("pageSize") { description = "Items per page, 1..100 (default 25)" }
                    queryParameter<ProductCategoryDto>("category") { description = "Filter by category" }
                    queryParameter<String>("q") { description = "Case-insensitive name search" }
                    queryParameter<ProductSortDto>("sort") { description = "Sort order (default newest)" }
                }
                response {
                    HttpStatusCode.OK to {
                        description = "One page of products, archived included"
                        body<ProductListResponse>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                val params = call.request.queryParameters
                val query = ProductQuery(
                    page = (params["page"]?.toIntOrNull() ?: 1).coerceAtLeast(1),
                    pageSize = (params["pageSize"]?.toIntOrNull() ?: 25).coerceIn(1, ProductQuery.MAX_PAGE_SIZE),
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
                    includeArchived = true,
                )
                call.respond(listProducts(query).toResponse())
            }

            post({
                operationId = "createProduct"
                summary = "Create a product"
                description = "Slug derives from the name at creation and never changes."
                request { body<ProductInputRequest>() }
                response {
                    HttpStatusCode.Created to {
                        description = "The created product"
                        body<ProductResponse>()
                    }
                    HttpStatusCode.BadRequest to { description = "Validation failed" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                val input = call.receive<ProductInputRequest>().toInput()
                call.respond(HttpStatusCode.Created, createProduct(input).toResponse())
            }

            put("{id}", {
                operationId = "updateProduct"
                summary = "Update a product's details, price, and stock"
                description = "Never touches placed orders — they hold their own snapshots."
                request {
                    pathParameter<String>("id") { description = "Product UUID" }
                    body<ProductInputRequest>()
                }
                response {
                    HttpStatusCode.OK to {
                        description = "The updated product"
                        body<ProductResponse>()
                    }
                    HttpStatusCode.BadRequest to { description = "Validation failed" }
                    HttpStatusCode.NotFound to { description = "No such product" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                val id = productIdFrom(call.parameters["id"])
                val input = call.receive<ProductInputRequest>().toInput()
                call.respond(updateProduct(id, input).toResponse())
            }

            put("{id}/archive", {
                operationId = "setProductArchived"
                summary = "Archive or restore a product"
                description = "Archived products vanish from the public catalog but stay in the " +
                    "back office and in historical order snapshots."
                request {
                    pathParameter<String>("id") { description = "Product UUID" }
                    body<ArchiveProductRequest>()
                }
                response {
                    HttpStatusCode.OK to {
                        description = "The product with its new archived state"
                        body<ProductResponse>()
                    }
                    HttpStatusCode.NotFound to { description = "No such product" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                val id = productIdFrom(call.parameters["id"])
                val dto = call.receive<ArchiveProductRequest>()
                call.respond(setProductArchived(id, dto.archived).toResponse())
            }
        }
    }
}
