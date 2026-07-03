package com.etherealnature.backend.cart.api

import com.etherealnature.backend.cart.application.GetCart
import com.etherealnature.backend.cart.application.MergeCart
import com.etherealnature.backend.cart.application.SetCartItem
import com.etherealnature.backend.cart.domain.GuestLine
import com.etherealnature.backend.platform.JWT_AUTH
import com.etherealnature.backend.platform.authenticatedUserId
import io.github.smiley4.ktoropenapi.get
import io.github.smiley4.ktoropenapi.post
import io.github.smiley4.ktoropenapi.put
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.route
import kotlin.uuid.Uuid
import org.koin.ktor.ext.inject

private fun parseUuid(raw: String, what: String): Uuid =
    runCatching { Uuid.parse(raw) }.getOrElse { throw BadRequestException("Invalid $what: $raw") }

fun Route.cartRoutes() {
    val getCart by inject<GetCart>()
    val mergeCart by inject<MergeCart>()
    val setCartItem by inject<SetCartItem>()

    authenticate(JWT_AUTH) {
        route("cart") {
            get({
                operationId = "getCart"
                summary = "The authenticated user's cart, priced fresh from the catalog"
                response {
                    HttpStatusCode.OK to {
                        description = "Current server cart"
                        body<CartResponse>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                call.respond(getCart(authenticatedUserId()).toResponse())
            }

            post("merge", {
                operationId = "mergeCart"
                summary = "Merge guest cart lines into the server cart"
                description = "Sum-then-clamp policy with an adjustments report. " +
                    "Idempotent per mergeId: replaying a processed merge returns the cart unchanged. " +
                    "Client price snapshots are display provenance only — never trusted."
                request { body<MergeCartRequest>() }
                response {
                    HttpStatusCode.OK to {
                        description = "Merged cart plus adjustments (dropped / clamped / price-changed)"
                        body<MergeCartResponse>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                val dto = call.receive<MergeCartRequest>()
                val outcome = mergeCart(
                    userId = authenticatedUserId(),
                    guestLines = dto.lines.map {
                        GuestLine(
                            productId = parseUuid(it.productId, "product id"),
                            quantity = it.quantity,
                            priceSnapshotMinor = it.priceSnapshotMinor,
                        )
                    },
                    mergeId = parseUuid(dto.mergeId, "merge id"),
                )
                call.respond(
                    MergeCartResponse(
                        cart = outcome.cart.toResponse(),
                        adjustments = outcome.adjustments.toResponse(),
                    ),
                )
            }

            put("items", {
                operationId = "setCartItem"
                summary = "Set a line's quantity (0 removes the line)"
                request { body<SetCartItemRequest>() }
                response {
                    HttpStatusCode.OK to {
                        description = "Updated cart"
                        body<CartResponse>()
                    }
                    HttpStatusCode.Conflict to { description = "Product unavailable" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                val dto = call.receive<SetCartItemRequest>()
                val snapshot = setCartItem(
                    userId = authenticatedUserId(),
                    productId = parseUuid(dto.productId, "product id"),
                    quantity = dto.quantity,
                )
                call.respond(snapshot.toResponse())
            }
        }
    }
}
