package com.etherealnature.backend.catalog.application

import com.etherealnature.backend.catalog.domain.CatalogError
import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductId

class GetProduct(
    private val products: ProductRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(id: ProductId): Product = tx.run {
        products.findById(id) ?: throw CatalogError.ProductNotFound(id)
    }
}
