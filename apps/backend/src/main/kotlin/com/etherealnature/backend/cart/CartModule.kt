package com.etherealnature.backend.cart

import com.etherealnature.backend.cart.application.CartRepository
import com.etherealnature.backend.cart.application.ClearCart
import com.etherealnature.backend.cart.application.GetCart
import com.etherealnature.backend.cart.application.GetCartLines
import com.etherealnature.backend.cart.application.MergeCart
import com.etherealnature.backend.cart.application.ProductCatalogPort
import com.etherealnature.backend.cart.application.SetCartItem
import com.etherealnature.backend.cart.application.TransactionRunner
import com.etherealnature.backend.cart.infrastructure.CatalogAdapter
import com.etherealnature.backend.cart.infrastructure.ExposedCartRepository
import com.etherealnature.backend.cart.infrastructure.ExposedTransactionRunner
import org.koin.dsl.module

/** Composition root for the cart context. */
val cartModule = module {
    single<TransactionRunner> { ExposedTransactionRunner(get()) }
    single<CartRepository> { ExposedCartRepository() }
    single<ProductCatalogPort> { CatalogAdapter(get()) }
    single { GetCart(get(), get(), get()) }
    single { MergeCart(get(), get(), get()) }
    single { SetCartItem(get(), get(), get()) }
    single { GetCartLines(get()) }
    single { ClearCart(get()) }
}
