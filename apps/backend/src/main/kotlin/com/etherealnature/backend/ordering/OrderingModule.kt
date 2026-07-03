package com.etherealnature.backend.ordering

import com.etherealnature.backend.ordering.application.CartGateway
import com.etherealnature.backend.ordering.application.GetMyOrders
import com.etherealnature.backend.ordering.application.GetOrder
import com.etherealnature.backend.ordering.application.ListOrders
import com.etherealnature.backend.ordering.application.OrderRepository
import com.etherealnature.backend.ordering.application.PlaceOrder
import com.etherealnature.backend.ordering.application.ProductCatalogPort
import com.etherealnature.backend.ordering.application.TransactionRunner
import com.etherealnature.backend.ordering.application.TransitionOrderStatus
import com.etherealnature.backend.ordering.infrastructure.CartAdapter
import com.etherealnature.backend.ordering.infrastructure.CatalogAdapter
import com.etherealnature.backend.ordering.infrastructure.ExposedOrderRepository
import com.etherealnature.backend.ordering.infrastructure.ExposedTransactionRunner
import org.koin.dsl.module

/** Composition root for the ordering context. */
val orderingModule = module {
    single<TransactionRunner> { ExposedTransactionRunner(get()) }
    single<OrderRepository> { ExposedOrderRepository() }
    single<CartGateway> { CartAdapter(get(), get()) }
    single<ProductCatalogPort> { CatalogAdapter(get(), get()) }
    single { PlaceOrder(get(), get(), get(), get()) }
    single { GetMyOrders(get(), get()) }
    single { GetOrder(get(), get()) }
    single { ListOrders(get(), get()) }
    single { TransitionOrderStatus(get(), get()) }
}
