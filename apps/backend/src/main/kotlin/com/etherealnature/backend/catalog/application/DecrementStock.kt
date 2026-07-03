package com.etherealnature.backend.catalog.application

import com.etherealnature.backend.catalog.domain.ProductId

data class StockDecrement(val productId: ProductId, val quantity: Int)

/**
 * Atomically decrements stock for a set of products. Returns the ids whose
 * decrement failed (insufficient stock at write time — the race guard
 * behind checkout's earlier read). No transaction of its own: composed
 * inside the caller's use-case transaction so a partial failure rolls back
 * with everything else.
 */
class DecrementStock(private val products: ProductRepository) {
    operator fun invoke(items: List<StockDecrement>): List<ProductId> =
        items.filterNot { products.decrementStock(it.productId, it.quantity) }.map { it.productId }
}
