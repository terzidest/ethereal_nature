package com.etherealnature.backend.catalog.application

class ListProducts(
    private val products: ProductRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(query: ProductQuery): ProductPage = tx.run {
        products.findPage(query)
    }
}
