package com.etherealnature.backend.cart.domain

import kotlin.uuid.Uuid

/** Sealed domain errors — mapped to HTTP exactly once, in StatusPages. */
sealed class CartError : Exception() {
    class ProductUnavailable(val productId: Uuid) : CartError() {
        override val message: String get() = "Product $productId is not available"
    }
}
