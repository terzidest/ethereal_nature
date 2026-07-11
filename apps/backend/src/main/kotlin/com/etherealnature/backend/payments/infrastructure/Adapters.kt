package com.etherealnature.backend.payments.infrastructure

import com.etherealnature.backend.ordering.application.GetOrder
import com.etherealnature.backend.ordering.application.TransitionOrderStatus
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderStatus
import com.etherealnature.backend.ordering.domain.OrderingError
import com.etherealnature.backend.payments.application.OrderGateway
import com.etherealnature.backend.payments.application.PayableOrder
import com.etherealnature.backend.payments.application.TransactionRunner
import kotlin.uuid.Uuid
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

/** In-process adapters onto other contexts' application services (§4.4). */

class OrderingAdapter(
    private val getOrder: GetOrder,
    private val transitionOrderStatus: TransitionOrderStatus,
) : OrderGateway {

    override fun findOwnedOrder(orderId: Uuid, requesterId: Uuid): PayableOrder? =
        try {
            val order = getOrder(OrderId(orderId), requesterId, isAdmin = false)
            PayableOrder(
                orderId = orderId,
                userId = order.userId,
                totalMinor = order.totalMinor,
                currency = order.currency,
                isPlaced = order.status == OrderStatus.PLACED,
            )
        } catch (_: OrderingError.OrderNotFound) {
            null
        }

    override fun markPaid(orderId: Uuid) {
        try {
            transitionOrderStatus(OrderId(orderId), OrderStatus.PAID)
        } catch (_: OrderingError.InvalidStatusTransition) {
            // Already at or past PAID (e.g. an admin advanced it first) — the
            // goal state holds, so a replayed or racing webhook is a no-op.
        }
    }
}

class ExposedTransactionRunner(private val database: Database) : TransactionRunner {
    override fun <T> run(block: () -> T): T = transaction(database) { block() }
}
