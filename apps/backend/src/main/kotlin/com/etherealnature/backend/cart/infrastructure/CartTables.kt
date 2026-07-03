package com.etherealnature.backend.cart.infrastructure

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.timestamp

// No FK to users/products: contexts do not reference each other's tables,
// even at the schema level (extractability seam).
object CartsTable : Table("carts") {
    val userId = uuid("user_id")
    val lastMergeId = uuid("last_merge_id").nullable()
    val updatedAt = timestamp("updated_at")

    override val primaryKey = PrimaryKey(userId)
}

object CartLinesTable : Table("cart_lines") {
    val userId = uuid("user_id")
    val productId = uuid("product_id")
    val quantity = integer("quantity")
    val position = integer("position")

    override val primaryKey = PrimaryKey(userId, productId)
}
