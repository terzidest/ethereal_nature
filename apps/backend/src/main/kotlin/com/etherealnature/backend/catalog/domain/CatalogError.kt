package com.etherealnature.backend.catalog.domain

/** Sealed domain errors — mapped to HTTP exactly once, in StatusPages. */
sealed class CatalogError : Exception() {
    class ProductNotFound(val id: ProductId) : CatalogError() {
        override val message: String get() = "Product $id not found"
    }
}
