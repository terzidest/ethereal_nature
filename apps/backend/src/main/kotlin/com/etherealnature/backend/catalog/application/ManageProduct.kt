package com.etherealnature.backend.catalog.application

import com.etherealnature.backend.catalog.domain.CatalogError
import com.etherealnature.backend.catalog.domain.Money
import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductCategory
import com.etherealnature.backend.catalog.domain.ProductId
import com.etherealnature.backend.catalog.domain.StockLevel
import kotlin.uuid.Uuid

/**
 * Admin write input. Validation happens by constructing domain value
 * objects — invalid input can't produce a Product at all.
 */
data class ProductInput(
    val name: String,
    val description: String,
    val priceMinor: Long,
    val currency: String,
    val stock: Int,
    val category: ProductCategory,
    val imageUrl: String?,
)

internal fun slugify(name: String): String =
    name.lowercase()
        .replace(Regex("[^a-z0-9]+"), "-")
        .trim('-')
        .take(100)
        .ifEmpty { "product" }

class CreateProduct(
    private val products: ProductRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(input: ProductInput): Product = tx.run {
        // Slug derives from the name once, at creation, then never changes —
        // product URLs stay stable through renames.
        val base = slugify(input.name)
        var slug = base
        var attempt = 2
        while (products.slugExists(slug)) {
            slug = "$base-${attempt++}"
        }

        Product(
            id = ProductId(Uuid.random()),
            slug = slug,
            name = input.name,
            description = input.description,
            price = Money(input.priceMinor, input.currency),
            stock = StockLevel(input.stock),
            category = input.category,
            imageUrl = input.imageUrl,
            archived = false,
        ).also(products::insert)
    }
}

class UpdateProduct(
    private val products: ProductRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(id: ProductId, input: ProductInput): Product = tx.run {
        val existing = products.findById(id) ?: throw CatalogError.ProductNotFound(id)
        existing.copy(
            name = input.name,
            description = input.description,
            price = Money(input.priceMinor, input.currency),
            stock = StockLevel(input.stock),
            category = input.category,
            imageUrl = input.imageUrl,
        ).also(products::update)
    }
}

class SetProductArchived(
    private val products: ProductRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(id: ProductId, archived: Boolean): Product = tx.run {
        val existing = products.findById(id) ?: throw CatalogError.ProductNotFound(id)
        existing.copy(archived = archived).also(products::update)
    }
}
