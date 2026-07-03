package com.etherealnature.backend.ordering.domain

import java.time.Instant
import kotlin.uuid.Uuid

@JvmInline
value class OrderId(val value: Uuid) {
    override fun toString(): String = value.toString()
}

/**
 * A frozen snapshot line. Name and price are copied at placement — catalog
 * changes never reach into a placed order.
 */
data class OrderLine(
    val productId: Uuid,
    val name: String,
    val quantity: Int,
    val unitPriceMinor: Long,
    val currency: String,
) {
    init {
        require(quantity > 0) { "Order line quantity must be positive" }
        require(unitPriceMinor >= 0) { "Order line price cannot be negative" }
    }

    val lineTotalMinor: Long get() = unitPriceMinor * quantity
}

/** Linear fulfillment flow — the only mutation an order ever sees. */
enum class OrderStatus {
    PLACED, PAID, PACKED, SHIPPED;

    val next: OrderStatus? get() = entries.getOrNull(ordinal + 1)

    fun canTransitionTo(target: OrderStatus): Boolean = target == next
}

/** Immutable aggregate: no copy-and-save, no line edits, only status advance. */
data class Order(
    val id: OrderId,
    val userId: Uuid,
    val lines: List<OrderLine>,
    val status: OrderStatus,
    val placedAt: Instant,
) {
    init {
        require(lines.isNotEmpty()) { "An order must have at least one line" }
    }

    val totalMinor: Long get() = lines.sumOf { it.lineTotalMinor }
    val currency: String get() = lines.first().currency
}
