package com.etherealnature.backend.ordering.infrastructure

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.timestamp

// Immutable by convention and by code path: the repository exposes insert
// and a status-only update — nothing else. No cross-context FKs.
object OrdersTable : Table("orders") {
    val id = uuid("id")
    val userId = uuid("user_id")
    val status = varchar("status", 32)
    val placedAt = timestamp("placed_at")

    override val primaryKey = PrimaryKey(id)
}

object OrderLinesTable : Table("order_lines") {
    val orderId = uuid("order_id")
    val productId = uuid("product_id")
    val name = varchar("name", 200)
    val quantity = integer("quantity")
    val unitPriceMinor = long("unit_price_minor")
    val currency = varchar("currency", 3)
    val position = integer("position")

    override val primaryKey = PrimaryKey(orderId, productId)
}
