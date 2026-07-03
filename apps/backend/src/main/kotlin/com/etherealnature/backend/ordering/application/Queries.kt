package com.etherealnature.backend.ordering.application

import com.etherealnature.backend.ordering.domain.Order
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderStatus
import com.etherealnature.backend.ordering.domain.OrderingError
import kotlin.uuid.Uuid

class GetMyOrders(
    private val orders: OrderRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(userId: Uuid): List<Order> = tx.run { orders.findByUser(userId) }
}

class GetOrder(
    private val orders: OrderRepository,
    private val tx: TransactionRunner,
) {
    /** Owners see their own orders; admins see any. Others get a 404, not a 403 — no order-id probing. */
    operator fun invoke(id: OrderId, requesterId: Uuid, isAdmin: Boolean): Order = tx.run {
        val order = orders.findById(id) ?: throw OrderingError.OrderNotFound(id)
        if (!isAdmin && order.userId != requesterId) throw OrderingError.OrderNotFound(id)
        order
    }
}

data class OrderPage(val items: List<Order>, val page: Int, val pageSize: Int, val totalItems: Long) {
    val totalPages: Long get() = if (totalItems == 0L) 0 else (totalItems + pageSize - 1) / pageSize
}

class ListOrders(
    private val orders: OrderRepository,
    private val tx: TransactionRunner,
) {
    operator fun invoke(page: Int, pageSize: Int, status: OrderStatus?): OrderPage = tx.run {
        val (items, total) = orders.findPage(page, pageSize, status)
        OrderPage(items = items, page = page, pageSize = pageSize, totalItems = total)
    }
}

class TransitionOrderStatus(
    private val orders: OrderRepository,
    private val tx: TransactionRunner,
) {
    /** The only mutation an order supports: advancing one step in the fulfillment flow. */
    operator fun invoke(id: OrderId, target: OrderStatus): Order = tx.run {
        val order = orders.findById(id) ?: throw OrderingError.OrderNotFound(id)
        if (!order.status.canTransitionTo(target)) {
            throw OrderingError.InvalidStatusTransition(order.status, target)
        }
        orders.updateStatus(id, target)
        order.copy(status = target)
    }
}
