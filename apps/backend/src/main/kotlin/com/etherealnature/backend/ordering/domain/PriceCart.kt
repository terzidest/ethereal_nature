package com.etherealnature.backend.ordering.domain

import kotlin.uuid.Uuid

/** What ordering wants from the cart: intents only. */
data class OrderIntent(val productId: Uuid, val quantity: Int)

/** Catalog snapshot — ordering's own vocabulary, no catalog imports. */
data class ProductInfo(
    val name: String,
    val priceMinor: Long,
    val currency: String,
    val stock: Int,
    val archived: Boolean,
)

enum class IssueKind { UNAVAILABLE, INSUFFICIENT_STOCK }

data class CheckoutIssue(
    val productId: Uuid,
    val name: String?,
    val kind: IssueKind,
    val requestedQuantity: Int,
    val availableStock: Int,
)

data class PricedCart(
    val lines: List<OrderLine>,
    val issues: List<CheckoutIssue>,
) {
    val totalMinor: Long get() = lines.sumOf { it.lineTotalMinor }
    val isPlaceable: Boolean get() = issues.isEmpty() && lines.isNotEmpty()
}

/**
 * Pure final re-validation before an order is written (ADR-0007). Prices
 * come exclusively from the catalog snapshot; anything unavailable or
 * short on stock becomes an issue that blocks placement — checkout never
 * silently clamps the way merge does.
 */
fun priceCart(intents: List<OrderIntent>, products: Map<Uuid, ProductInfo>): PricedCart {
    val lines = mutableListOf<OrderLine>()
    val issues = mutableListOf<CheckoutIssue>()

    for (intent in intents) {
        val info = products[intent.productId]
        when {
            info == null || info.archived ->
                issues += CheckoutIssue(intent.productId, info?.name, IssueKind.UNAVAILABLE, intent.quantity, 0)
            info.stock < intent.quantity ->
                issues += CheckoutIssue(
                    intent.productId, info.name, IssueKind.INSUFFICIENT_STOCK, intent.quantity, info.stock,
                )
            else ->
                lines += OrderLine(
                    productId = intent.productId,
                    name = info.name,
                    quantity = intent.quantity,
                    unitPriceMinor = info.priceMinor,
                    currency = info.currency,
                )
        }
    }
    return PricedCart(lines = lines, issues = issues)
}
