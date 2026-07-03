package com.etherealnature.backend.cart.application

import kotlin.uuid.Uuid

class GetCart(
    private val carts: CartRepository,
    private val catalog: ProductCatalogPort,
    private val tx: TransactionRunner,
) {
    operator fun invoke(userId: Uuid): CartSnapshot = tx.run {
        val lines = carts.findLines(userId)
        snapshotOf(lines, catalog.productInfo(lines.map { it.productId }))
    }
}
