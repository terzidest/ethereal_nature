package com.etherealnature.backend.ordering.infrastructure

import com.etherealnature.backend.ordering.application.OrderRepository
import com.etherealnature.backend.ordering.domain.Order
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderLine
import com.etherealnature.backend.ordering.domain.OrderStatus
import kotlin.uuid.Uuid
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update

class ExposedOrderRepository : OrderRepository {

    override fun insert(order: Order) {
        OrdersTable.insert {
            it[id] = order.id.value
            it[userId] = order.userId
            it[status] = order.status.name
            it[placedAt] = order.placedAt
        }
        order.lines.forEachIndexed { index, line ->
            OrderLinesTable.insert {
                it[orderId] = order.id.value
                it[productId] = line.productId
                it[name] = line.name
                it[quantity] = line.quantity
                it[unitPriceMinor] = line.unitPriceMinor
                it[currency] = line.currency
                it[position] = index
            }
        }
    }

    override fun findById(id: OrderId): Order? =
        OrdersTable.selectAll()
            .where(OrdersTable.id eq id.value)
            .singleOrNull()
            ?.let { hydrate(listOf(it)).single() }

    override fun findByUser(userId: Uuid): List<Order> =
        hydrate(
            OrdersTable.selectAll()
                .where(OrdersTable.userId eq userId)
                .orderBy(OrdersTable.placedAt to SortOrder.DESC)
                .toList(),
        )

    override fun findPage(page: Int, pageSize: Int, status: OrderStatus?): Pair<List<Order>, Long> {
        val base = OrdersTable.selectAll()
        status?.let { base.where(OrdersTable.status eq it.name) }
        val total = base.count()
        val rows = base
            .orderBy(OrdersTable.placedAt to SortOrder.DESC)
            .limit(pageSize)
            .offset((page - 1).toLong() * pageSize)
            .toList()
        return hydrate(rows) to total
    }

    override fun updateStatus(id: OrderId, status: OrderStatus) {
        OrdersTable.update(where = { OrdersTable.id eq id.value }) {
            it[OrdersTable.status] = status.name
        }
    }

    private fun hydrate(orderRows: List<ResultRow>): List<Order> {
        if (orderRows.isEmpty()) return emptyList()
        val ids = orderRows.map { it[OrdersTable.id] }
        val linesByOrder = OrderLinesTable.selectAll()
            .where(OrderLinesTable.orderId inList ids)
            .orderBy(OrderLinesTable.position to SortOrder.ASC)
            .groupBy({ it[OrderLinesTable.orderId] }) { row ->
                OrderLine(
                    productId = row[OrderLinesTable.productId],
                    name = row[OrderLinesTable.name],
                    quantity = row[OrderLinesTable.quantity],
                    unitPriceMinor = row[OrderLinesTable.unitPriceMinor],
                    currency = row[OrderLinesTable.currency],
                )
            }
        return orderRows.map { row ->
            Order(
                id = OrderId(row[OrdersTable.id]),
                userId = row[OrdersTable.userId],
                lines = linesByOrder[row[OrdersTable.id]].orEmpty(),
                status = OrderStatus.valueOf(row[OrdersTable.status]),
                placedAt = row[OrdersTable.placedAt],
            )
        }
    }
}
