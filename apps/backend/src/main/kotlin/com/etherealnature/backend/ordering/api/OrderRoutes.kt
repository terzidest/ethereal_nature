package com.etherealnature.backend.ordering.api

import com.etherealnature.backend.ordering.application.GetMyOrders
import com.etherealnature.backend.ordering.application.GetOrder
import com.etherealnature.backend.ordering.application.ListOrders
import com.etherealnature.backend.ordering.application.PlaceOrder
import com.etherealnature.backend.ordering.application.PlaceOrderOutcome
import com.etherealnature.backend.ordering.application.TransitionOrderStatus
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderStatus
import com.etherealnature.backend.platform.JWT_AUTH
import com.etherealnature.backend.platform.authenticatedUserId
import com.etherealnature.backend.platform.isAdmin
import com.etherealnature.backend.platform.requireRole
import io.github.smiley4.ktoropenapi.get
import io.github.smiley4.ktoropenapi.post
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.route
import kotlin.uuid.Uuid
import org.koin.ktor.ext.inject

private fun orderIdFrom(raw: String?): OrderId =
    OrderId(
        runCatching { Uuid.parse(raw ?: throw BadRequestException("Missing order id")) }
            .getOrElse { throw BadRequestException("Invalid order id: $raw") },
    )

fun Route.orderRoutes() {
    val placeOrder by inject<PlaceOrder>()
    val getMyOrders by inject<GetMyOrders>()
    val getOrder by inject<GetOrder>()
    val listOrders by inject<ListOrders>()
    val transitionOrderStatus by inject<TransitionOrderStatus>()

    authenticate(JWT_AUTH) {
        route("orders") {
            post({
                operationId = "placeOrder"
                summary = "Place an order from the current cart"
                description = "Atomic: final price/stock re-validation, stock decrement, immutable order " +
                    "write, cart cleared — one transaction. Rejected with 409 when the re-validation " +
                    "finds changes (issues, or a total that no longer matches expectedTotalMinor)."
                request { body<PlaceOrderRequest>() }
                response {
                    HttpStatusCode.Created to {
                        description = "The frozen order"
                        body<OrderResponse>()
                    }
                    HttpStatusCode.Conflict to {
                        description = "Cart changed since it was displayed — confirm again"
                        body<CheckoutRejectionResponse>()
                    }
                    HttpStatusCode.BadRequest to { description = "Empty cart" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                val dto = call.receive<PlaceOrderRequest>()
                when (val outcome = placeOrder(authenticatedUserId(), dto.expectedTotalMinor)) {
                    is PlaceOrderOutcome.Placed ->
                        call.respond(HttpStatusCode.Created, outcome.order.toResponse())
                    is PlaceOrderOutcome.Rejected ->
                        call.respond(
                            HttpStatusCode.Conflict,
                            CheckoutRejectionResponse(
                                issues = outcome.issues.map { it.toDto() },
                                currentTotalMinor = outcome.currentTotalMinor,
                            ),
                        )
                }
            }

            get({
                operationId = "getMyOrders"
                summary = "The authenticated user's order history, newest first"
                response {
                    HttpStatusCode.OK to {
                        description = "Own orders"
                        body<List<OrderResponse>>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                call.respond(getMyOrders(authenticatedUserId()).map { it.toResponse() })
            }

            get("{id}", {
                operationId = "getOrder"
                summary = "A single order (owner or admin)"
                request { pathParameter<String>("id") { description = "Order UUID" } }
                response {
                    HttpStatusCode.OK to {
                        description = "The order"
                        body<OrderResponse>()
                    }
                    HttpStatusCode.NotFound to { description = "No such order (or not yours)" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                }
            }) {
                val order = getOrder(
                    id = orderIdFrom(call.parameters["id"]),
                    requesterId = authenticatedUserId(),
                    isAdmin = isAdmin(),
                )
                call.respond(order.toResponse())
            }
        }
    }

    requireRole("ADMIN") {
        route("admin/orders") {
            get({
                operationId = "listAllOrders"
                summary = "All orders (admin), paginated, newest first"
                request {
                    queryParameter<Int>("page") { description = "1-based page (default 1)" }
                    queryParameter<Int>("pageSize") { description = "Items per page, 1..100 (default 25)" }
                    queryParameter<OrderStatusDto>("status") { description = "Filter by fulfillment status" }
                }
                response {
                    HttpStatusCode.OK to {
                        description = "One page of orders"
                        body<OrderListResponse>()
                    }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                val params = call.request.queryParameters
                val page = (params["page"]?.toIntOrNull() ?: 1).coerceAtLeast(1)
                val pageSize = (params["pageSize"]?.toIntOrNull() ?: 25).coerceIn(1, 100)
                val status = params["status"]?.let { raw ->
                    OrderStatus.entries.find { it.name.equals(raw, ignoreCase = true) }
                }
                call.respond(listOrders(page, pageSize, status).toResponse())
            }

            post("{id}/status", {
                operationId = "transitionOrderStatus"
                summary = "Advance an order's fulfillment status (admin)"
                description = "The only mutation an order supports. Transitions are linear " +
                    "(PLACED → PAID → PACKED → SHIPPED); anything else is rejected. " +
                    "Order contents are never editable."
                request {
                    pathParameter<String>("id") { description = "Order UUID" }
                    body<TransitionStatusRequest>()
                }
                response {
                    HttpStatusCode.OK to {
                        description = "Order with the new status"
                        body<OrderResponse>()
                    }
                    HttpStatusCode.Conflict to { description = "Invalid transition" }
                    HttpStatusCode.NotFound to { description = "No such order" }
                    HttpStatusCode.Unauthorized to { description = "Missing or invalid token" }
                    HttpStatusCode.Forbidden to { description = "Requires ADMIN role" }
                }
            }) {
                val dto = call.receive<TransitionStatusRequest>()
                val order = transitionOrderStatus(
                    id = orderIdFrom(call.parameters["id"]),
                    target = OrderStatus.valueOf(dto.status.name),
                )
                call.respond(order.toResponse())
            }
        }
    }
}
