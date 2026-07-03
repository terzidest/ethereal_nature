package com.etherealnature.backend.ordering.api

import com.etherealnature.backend.ordering.application.OrderPage
import com.etherealnature.backend.ordering.domain.CheckoutIssue
import com.etherealnature.backend.ordering.domain.Order
import kotlinx.serialization.Serializable

@Serializable
enum class OrderStatusDto { PLACED, PAID, PACKED, SHIPPED }

@Serializable
enum class IssueKindDto { UNAVAILABLE, INSUFFICIENT_STOCK }

@Serializable
data class OrderLineResponse(
    val productId: String,
    val name: String,
    val quantity: Int,
    val unitPriceMinor: Long,
    val currency: String,
    val lineTotalMinor: Long,
)

@Serializable
data class OrderResponse(
    val id: String,
    val userId: String,
    val status: OrderStatusDto,
    val lines: List<OrderLineResponse>,
    val totalMinor: Long,
    val currency: String,
    val placedAtEpochSeconds: Long,
)

@Serializable
data class OrderListResponse(
    val items: List<OrderResponse>,
    val page: Int,
    val pageSize: Int,
    val totalItems: Long,
    val totalPages: Long,
)

@Serializable
data class PlaceOrderRequest(val expectedTotalMinor: Long)

@Serializable
data class CheckoutIssueDto(
    val productId: String,
    val name: String?,
    val kind: IssueKindDto,
    val requestedQuantity: Int,
    val availableStock: Int,
)

/** 409 body: the final re-validation found changes the user must confirm. */
@Serializable
data class CheckoutRejectionResponse(
    val issues: List<CheckoutIssueDto>,
    val currentTotalMinor: Long,
)

@Serializable
data class TransitionStatusRequest(val status: OrderStatusDto)

fun Order.toResponse(): OrderResponse = OrderResponse(
    id = id.toString(),
    userId = userId.toString(),
    status = OrderStatusDto.valueOf(status.name),
    lines = lines.map {
        OrderLineResponse(
            productId = it.productId.toString(),
            name = it.name,
            quantity = it.quantity,
            unitPriceMinor = it.unitPriceMinor,
            currency = it.currency,
            lineTotalMinor = it.lineTotalMinor,
        )
    },
    totalMinor = totalMinor,
    currency = currency,
    placedAtEpochSeconds = placedAt.epochSecond,
)

fun OrderPage.toResponse(): OrderListResponse = OrderListResponse(
    items = items.map { it.toResponse() },
    page = page,
    pageSize = pageSize,
    totalItems = totalItems,
    totalPages = totalPages,
)

fun CheckoutIssue.toDto(): CheckoutIssueDto = CheckoutIssueDto(
    productId = productId.toString(),
    name = name,
    kind = IssueKindDto.valueOf(kind.name),
    requestedQuantity = requestedQuantity,
    availableStock = availableStock,
)
