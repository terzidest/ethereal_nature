package com.etherealnature.backend.cart.application

import com.etherealnature.backend.cart.domain.CartError
import com.etherealnature.backend.cart.domain.CartLine
import kotlin.uuid.Uuid

class SetCartItem(
    private val carts: CartRepository,
    private val catalog: ProductCatalogPort,
    private val tx: TransactionRunner,
) {
    /** Sets a line's quantity (0 removes it). Quantity is clamped to stock. */
    operator fun invoke(userId: Uuid, productId: Uuid, quantity: Int): CartSnapshot = tx.run {
        require(quantity >= 0) { "Quantity cannot be negative" }
        val existing = carts.findLines(userId)

        val newLines = if (quantity == 0) {
            existing.filterNot { it.productId == productId }
        } else {
            val info = catalog.productInfo(listOf(productId))[productId]
            if (info == null || !info.purchasable) throw CartError.ProductUnavailable(productId)
            val granted = minOf(quantity, info.stock)
            if (existing.any { it.productId == productId }) {
                existing.map { if (it.productId == productId) CartLine(productId, granted) else it }
            } else {
                existing + CartLine(productId, granted)
            }
        }

        carts.replace(userId, newLines, mergeId = null)
        snapshotOf(newLines, catalog.productInfo(newLines.map { it.productId }))
    }
}
