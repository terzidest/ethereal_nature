package com.etherealnature.backend.cart.infrastructure

import com.etherealnature.backend.cart.application.CartRepository
import com.etherealnature.backend.cart.domain.CartLine
import java.time.Instant
import kotlin.uuid.Uuid
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.upsert

class ExposedCartRepository : CartRepository {

    override fun findLines(userId: Uuid): List<CartLine> =
        CartLinesTable.selectAll()
            .where(CartLinesTable.userId eq userId)
            .orderBy(CartLinesTable.position to SortOrder.ASC)
            .map { CartLine(productId = it[CartLinesTable.productId], quantity = it[CartLinesTable.quantity]) }

    override fun lastMergeId(userId: Uuid): Uuid? =
        CartsTable.selectAll()
            .where(CartsTable.userId eq userId)
            .singleOrNull()
            ?.get(CartsTable.lastMergeId)

    override fun replace(userId: Uuid, lines: List<CartLine>, mergeId: Uuid?) {
        CartsTable.upsert(CartsTable.userId) {
            it[CartsTable.userId] = userId
            if (mergeId != null) it[lastMergeId] = mergeId
            it[updatedAt] = Instant.now()
        }
        CartLinesTable.deleteWhere { CartLinesTable.userId eq userId }
        lines.forEachIndexed { index, line ->
            CartLinesTable.insert {
                it[CartLinesTable.userId] = userId
                it[productId] = line.productId
                it[quantity] = line.quantity
                it[position] = index
            }
        }
    }
}
