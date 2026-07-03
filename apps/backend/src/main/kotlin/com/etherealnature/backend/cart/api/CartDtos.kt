package com.etherealnature.backend.cart.api

import com.etherealnature.backend.cart.application.CartSnapshot
import com.etherealnature.backend.cart.domain.Adjustments
import kotlinx.serialization.Serializable

@Serializable
data class CartLineResponse(
    val productId: String,
    val name: String,
    val quantity: Int,
    val unitPriceMinor: Long,
    val currency: String,
    val stock: Int,
    val available: Boolean,
    val lineTotalMinor: Long,
)

@Serializable
data class CartResponse(
    val lines: List<CartLineResponse>,
    val subtotalMinor: Long,
    val currency: String,
)

@Serializable
enum class DropReasonDto { NOT_FOUND, ARCHIVED, OUT_OF_STOCK }

@Serializable
data class DroppedLineDto(val productId: String, val reason: DropReasonDto)

@Serializable
data class ClampedLineDto(val productId: String, val requestedQuantity: Int, val grantedQuantity: Int)

@Serializable
data class PriceChangeDto(val productId: String, val snapshotPriceMinor: Long, val currentPriceMinor: Long)

@Serializable
data class AdjustmentsDto(
    val dropped: List<DroppedLineDto>,
    val clamped: List<ClampedLineDto>,
    val priceChanged: List<PriceChangeDto>,
)

@Serializable
data class GuestLineDto(val productId: String, val quantity: Int, val priceSnapshotMinor: Long? = null)

@Serializable
data class MergeCartRequest(val mergeId: String, val lines: List<GuestLineDto>)

@Serializable
data class MergeCartResponse(val cart: CartResponse, val adjustments: AdjustmentsDto)

@Serializable
data class SetCartItemRequest(val productId: String, val quantity: Int)

fun CartSnapshot.toResponse(): CartResponse = CartResponse(
    lines = lines.map {
        CartLineResponse(
            productId = it.productId.toString(),
            name = it.name,
            quantity = it.quantity,
            unitPriceMinor = it.unitPriceMinor,
            currency = it.currency,
            stock = it.stock,
            available = it.available,
            lineTotalMinor = it.lineTotalMinor,
        )
    },
    subtotalMinor = subtotalMinor,
    currency = currency,
)

fun Adjustments.toResponse(): AdjustmentsDto = AdjustmentsDto(
    dropped = dropped.map { DroppedLineDto(it.productId.toString(), DropReasonDto.valueOf(it.reason.name)) },
    clamped = clamped.map { ClampedLineDto(it.productId.toString(), it.requestedQuantity, it.grantedQuantity) },
    priceChanged = priceChanged.map {
        PriceChangeDto(it.productId.toString(), it.snapshotPriceMinor, it.currentPriceMinor)
    },
)
