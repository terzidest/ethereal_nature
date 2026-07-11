package com.etherealnature.backend.payments.infrastructure

import com.etherealnature.backend.payments.application.PaymentIntentRepository
import com.etherealnature.backend.payments.domain.PaymentIntent
import com.etherealnature.backend.payments.domain.PaymentIntentId
import com.etherealnature.backend.payments.domain.PaymentIntentStatus
import kotlin.uuid.Uuid
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update

class ExposedPaymentIntentRepository : PaymentIntentRepository {

    override fun insert(intent: PaymentIntent) {
        PaymentIntentsTable.insert {
            it[id] = intent.id.value
            it[orderId] = intent.orderId
            it[userId] = intent.userId
            it[amountMinor] = intent.amountMinor
            it[currency] = intent.currency
            it[status] = intent.status.name
            it[createdAt] = intent.createdAt
            it[settledEventId] = intent.settledEventId
        }
    }

    override fun findById(id: PaymentIntentId): PaymentIntent? =
        PaymentIntentsTable.selectAll()
            .where(PaymentIntentsTable.id eq id.value)
            .singleOrNull()
            ?.toDomain()

    override fun findOpenByOrder(orderId: Uuid): PaymentIntent? =
        PaymentIntentsTable.selectAll()
            .where(
                (PaymentIntentsTable.orderId eq orderId) and
                    (PaymentIntentsTable.status eq PaymentIntentStatus.CREATED.name),
            )
            .orderBy(PaymentIntentsTable.createdAt to SortOrder.DESC)
            .limit(1)
            .firstOrNull()
            ?.toDomain()

    override fun settle(id: PaymentIntentId, status: PaymentIntentStatus, eventId: String) {
        PaymentIntentsTable.update(where = { PaymentIntentsTable.id eq id.value }) {
            it[PaymentIntentsTable.status] = status.name
            it[settledEventId] = eventId
        }
    }

    private fun ResultRow.toDomain() = PaymentIntent(
        id = PaymentIntentId(this[PaymentIntentsTable.id]),
        orderId = this[PaymentIntentsTable.orderId],
        userId = this[PaymentIntentsTable.userId],
        amountMinor = this[PaymentIntentsTable.amountMinor],
        currency = this[PaymentIntentsTable.currency],
        status = PaymentIntentStatus.valueOf(this[PaymentIntentsTable.status]),
        createdAt = this[PaymentIntentsTable.createdAt],
        settledEventId = this[PaymentIntentsTable.settledEventId],
    )
}
