package com.etherealnature.backend.ordering.application

import com.etherealnature.backend.ordering.domain.Order
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderIntent
import com.etherealnature.backend.ordering.domain.OrderStatus
import com.etherealnature.backend.ordering.domain.ProductInfo
import kotlin.uuid.Uuid

/** Ports owned by the ordering application layer; adapters in infrastructure. */

interface CartGateway {
    fun linesFor(userId: Uuid): List<OrderIntent>
    fun clear(userId: Uuid)
}

interface ProductCatalogPort {
    fun productInfo(ids: Collection<Uuid>): Map<Uuid, ProductInfo>

    /** Returns ids whose guarded decrement failed (insufficient stock). */
    fun decrementStock(items: List<OrderIntent>): List<Uuid>
}

interface OrderRepository {
    fun insert(order: Order)
    fun findById(id: OrderId): Order?
    fun findByUser(userId: Uuid): List<Order>
    fun findPage(page: Int, pageSize: Int, status: OrderStatus?): Pair<List<Order>, Long>
    fun updateStatus(id: OrderId, status: OrderStatus)
}

interface TransactionRunner {
    fun <T> run(block: () -> T): T
}
