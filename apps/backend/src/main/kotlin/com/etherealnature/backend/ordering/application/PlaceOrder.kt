package com.etherealnature.backend.ordering.application

import com.etherealnature.backend.ordering.domain.CheckoutIssue
import com.etherealnature.backend.ordering.domain.IssueKind
import com.etherealnature.backend.ordering.domain.Order
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderIntent
import com.etherealnature.backend.ordering.domain.OrderStatus
import com.etherealnature.backend.ordering.domain.OrderingError
import com.etherealnature.backend.ordering.domain.priceCart
import java.time.Instant
import kotlin.uuid.Uuid

sealed interface PlaceOrderOutcome {
    data class Placed(val order: Order) : PlaceOrderOutcome

    /** Final re-validation found changes — surfaced to the user, not silently applied. */
    data class Rejected(val issues: List<CheckoutIssue>, val currentTotalMinor: Long) : PlaceOrderOutcome
}

class PlaceOrder(
    private val cart: CartGateway,
    private val catalog: ProductCatalogPort,
    private val orders: OrderRepository,
    private val tx: TransactionRunner,
) {
    /**
     * The one atomic transaction of ADR-0007: re-validate price and stock,
     * decrement stock, write the immutable order, empty the cart. Any
     * failure rolls the whole thing back.
     *
     * [expectedTotalMinor] is what the client showed the user; a mismatch
     * (price drift since render) rejects so the user confirms the real
     * total — the client can never dictate a price, only refuse one.
     */
    operator fun invoke(userId: Uuid, expectedTotalMinor: Long): PlaceOrderOutcome = tx.run {
        val intents = cart.linesFor(userId)
        if (intents.isEmpty()) throw OrderingError.EmptyCart()

        val products = catalog.productInfo(intents.map { it.productId })
        val priced = priceCart(intents, products)

        if (priced.issues.isNotEmpty()) {
            return@run PlaceOrderOutcome.Rejected(priced.issues, priced.totalMinor)
        }
        if (priced.totalMinor != expectedTotalMinor) {
            return@run PlaceOrderOutcome.Rejected(emptyList(), priced.totalMinor)
        }

        val failed = catalog.decrementStock(intents)
        if (failed.isNotEmpty()) {
            // Raced another checkout between read and decrement.
            val issues = failed.map { id ->
                val intent = intents.first { it.productId == id }
                CheckoutIssue(
                    productId = id,
                    name = products[id]?.name,
                    kind = IssueKind.INSUFFICIENT_STOCK,
                    requestedQuantity = intent.quantity,
                    availableStock = products[id]?.stock ?: 0,
                )
            }
            return@run PlaceOrderOutcome.Rejected(issues, priced.totalMinor)
        }

        val order = Order(
            id = OrderId(Uuid.random()),
            userId = userId,
            lines = priced.lines,
            status = OrderStatus.PLACED,
            placedAt = Instant.now(),
        )
        orders.insert(order)
        cart.clear(userId)
        PlaceOrderOutcome.Placed(order)
    }
}
