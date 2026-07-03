package com.etherealnature.backend.catalog.application

import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductCategory
import com.etherealnature.backend.catalog.domain.ProductId

enum class ProductSort { NEWEST, NAME, PRICE_ASC, PRICE_DESC }

data class ProductQuery(
    val page: Int,
    val pageSize: Int,
    val category: ProductCategory?,
    val search: String?,
    val sort: ProductSort,
    /** Admin listings see archived products; the public catalog never does. */
    val includeArchived: Boolean = false,
) {
    init {
        require(page >= 1) { "page must be >= 1" }
        require(pageSize in 1..MAX_PAGE_SIZE) { "pageSize must be 1..$MAX_PAGE_SIZE" }
    }

    companion object {
        const val MAX_PAGE_SIZE = 100
    }
}

data class ProductPage(
    val items: List<Product>,
    val page: Int,
    val pageSize: Int,
    val totalItems: Long,
) {
    val totalPages: Long get() = if (totalItems == 0L) 0 else (totalItems + pageSize - 1) / pageSize
}

/** Port owned by the application layer; the Exposed adapter lives in infrastructure. */
interface ProductRepository {
    fun findPage(query: ProductQuery): ProductPage
    fun findById(id: ProductId): Product?
    fun findByIds(ids: Collection<ProductId>): List<Product>

    /** Guarded decrement: false when stock is insufficient (no change made). */
    fun decrementStock(id: ProductId, quantity: Int): Boolean

    fun slugExists(slug: String): Boolean
    fun insert(product: Product)
    fun update(product: Product)
}
