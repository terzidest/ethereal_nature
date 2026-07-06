package com.etherealnature.backend.cart.application

import com.etherealnature.backend.cart.domain.CartLine
import com.etherealnature.backend.cart.domain.ProductInfo
import kotlin.uuid.Uuid

/** What the API returns: lines priced fresh from the catalog, never from the client. */
data class PricedLine(
    val productId: Uuid,
    val name: String,
    val category: String,
    val quantity: Int,
    val unitPriceMinor: Long,
    val currency: String,
    val stock: Int,
    val available: Boolean,
) {
    val lineTotalMinor: Long get() = if (available) unitPriceMinor * quantity else 0
}

data class CartSnapshot(val lines: List<PricedLine>, val subtotalMinor: Long, val currency: String)

internal fun snapshotOf(lines: List<CartLine>, products: Map<Uuid, ProductInfo>): CartSnapshot {
    val priced = lines.mapNotNull { line ->
        val info = products[line.productId] ?: return@mapNotNull null
        PricedLine(
            productId = line.productId,
            name = info.name,
            category = info.category,
            quantity = line.quantity,
            unitPriceMinor = info.priceMinor,
            currency = info.currency,
            stock = info.stock,
            available = info.purchasable,
        )
    }
    return CartSnapshot(
        lines = priced,
        subtotalMinor = priced.sumOf { it.lineTotalMinor },
        currency = priced.firstOrNull()?.currency ?: "EUR",
    )
}
