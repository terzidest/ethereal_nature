package com.etherealnature.backend.ordering.domain

/** Sealed domain errors — mapped to HTTP exactly once, in StatusPages. */
sealed class OrderingError : Exception() {
    class EmptyCart : OrderingError() {
        override val message: String get() = "Cannot place an order from an empty cart"
    }

    class OrderNotFound(val id: OrderId) : OrderingError() {
        override val message: String get() = "Order $id not found"
    }

    class InvalidStatusTransition(val from: OrderStatus, val to: OrderStatus) : OrderingError() {
        override val message: String get() = "Cannot transition order from $from to $to"
    }
}
