package com.etherealnature.backend.payments.infrastructure

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.timestamp

// order_id / user_id are bare uuids — no cross-context FKs, matching the
// isolation convention of the other contexts' tables.
object PaymentIntentsTable : Table("payment_intents") {
    val id = uuid("id")
    val orderId = uuid("order_id")
    val userId = uuid("user_id")
    val amountMinor = long("amount_minor")
    val currency = varchar("currency", 3)
    val status = varchar("status", 32)
    val createdAt = timestamp("created_at")
    val settledEventId = varchar("settled_event_id", 100).nullable()

    override val primaryKey = PrimaryKey(id)
}
