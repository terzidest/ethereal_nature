package com.etherealnature.backend.catalog

import com.etherealnature.backend.catalog.application.DecrementStock
import com.etherealnature.backend.catalog.application.GetProduct
import com.etherealnature.backend.catalog.application.GetProductsByIds
import com.etherealnature.backend.catalog.application.ListProducts
import com.etherealnature.backend.catalog.application.ProductRepository
import com.etherealnature.backend.catalog.application.TransactionRunner
import com.etherealnature.backend.catalog.infrastructure.ExposedProductRepository
import com.etherealnature.backend.catalog.infrastructure.ExposedTransactionRunner
import org.koin.dsl.module

/** Composition root for the catalog context — the only file that sees all layers. */
val catalogModule = module {
    single<TransactionRunner> { ExposedTransactionRunner(get()) }
    single<ProductRepository> { ExposedProductRepository() }
    single { ListProducts(get(), get()) }
    single { GetProduct(get(), get()) }
    single { GetProductsByIds(get()) }
    single { DecrementStock(get()) }
}
