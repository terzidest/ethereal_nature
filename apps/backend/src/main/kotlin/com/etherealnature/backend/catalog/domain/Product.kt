package com.etherealnature.backend.catalog.domain

import kotlin.uuid.Uuid

@JvmInline
value class ProductId(val value: Uuid) {
    override fun toString(): String = value.toString()
}

/** Money in minor units (cents). Never negative, never floating point. */
data class Money(val amountMinor: Long, val currency: String) {
    init {
        require(amountMinor >= 0) { "Money cannot be negative: $amountMinor" }
        require(currency.matches(Regex("[A-Z]{3}"))) { "Invalid currency code: $currency" }
    }
}

@JvmInline
value class StockLevel(val quantity: Int) {
    init {
        require(quantity >= 0) { "Stock cannot be negative: $quantity" }
    }
}

enum class ProductCategory { OILS, HERBS, CRYSTALS, TEAS }

data class Product(
    val id: ProductId,
    val slug: String,
    val name: String,
    val description: String,
    val price: Money,
    val stock: StockLevel,
    val category: ProductCategory,
    val imageUrl: String?,
    val archived: Boolean,
) {
    init {
        require(name.isNotBlank()) { "Product name cannot be blank" }
        require(slug.matches(Regex("[a-z0-9]+(-[a-z0-9]+)*"))) { "Invalid slug: $slug" }
    }
}
