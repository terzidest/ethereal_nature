package com.etherealnature.backend.cart.domain

import kotlin.uuid.Uuid

/**
 * The cart context speaks about products only by id (Uuid) — it never
 * imports catalog domain types. What it needs to know about a product
 * arrives as a [ProductInfo] snapshot through its own port.
 */

data class CartLine(val productId: Uuid, val quantity: Int) {
    init {
        require(quantity > 0) { "Cart line quantity must be positive" }
    }
}

/** A guest intent from the client. The snapshot is display-provenance only. */
data class GuestLine(val productId: Uuid, val quantity: Int, val priceSnapshotMinor: Long?) {
    init {
        require(quantity > 0) { "Guest line quantity must be positive" }
    }
}

/** Catalog snapshot the merge works against — plain data, no IO. */
data class ProductInfo(
    val name: String,
    val category: String,
    val priceMinor: Long,
    val currency: String,
    val stock: Int,
    val archived: Boolean,
) {
    val purchasable: Boolean get() = !archived && stock > 0
}
