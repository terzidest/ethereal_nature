package com.etherealnature.backend.cart.application

import com.etherealnature.backend.cart.domain.Adjustments
import com.etherealnature.backend.cart.domain.GuestLine
import com.etherealnature.backend.cart.domain.mergeCarts
import kotlin.uuid.Uuid

data class MergeOutcome(val cart: CartSnapshot, val adjustments: Adjustments)

class MergeCart(
    private val carts: CartRepository,
    private val catalog: ProductCatalogPort,
    private val tx: TransactionRunner,
) {
    /**
     * One transaction: read existing cart, snapshot the catalog, run the
     * pure merge, persist. Idempotent via the client-generated mergeId —
     * replaying the same merge returns the current cart with no
     * adjustments instead of doubling quantities (ADR-0007).
     */
    operator fun invoke(userId: Uuid, guestLines: List<GuestLine>, mergeId: Uuid): MergeOutcome = tx.run {
        val existing = carts.findLines(userId)

        if (carts.lastMergeId(userId) == mergeId) {
            return@run MergeOutcome(
                cart = snapshotOf(existing, catalog.productInfo(existing.map { it.productId })),
                adjustments = Adjustments.NONE,
            )
        }

        val ids = (existing.map { it.productId } + guestLines.map { it.productId }).distinct()
        val products = catalog.productInfo(ids)
        val result = mergeCarts(guestLines, existing, products)

        carts.replace(userId, result.lines, mergeId)
        MergeOutcome(cart = snapshotOf(result.lines, products), adjustments = result.adjustments)
    }
}
