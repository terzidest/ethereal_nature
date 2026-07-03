package com.etherealnature.backend.cart.domain

import kotlin.uuid.Uuid

enum class DropReason { NOT_FOUND, ARCHIVED, OUT_OF_STOCK }

data class DroppedLine(val productId: Uuid, val reason: DropReason)
data class ClampedLine(val productId: Uuid, val requestedQuantity: Int, val grantedQuantity: Int)
data class PriceChange(val productId: Uuid, val snapshotPriceMinor: Long, val currentPriceMinor: Long)

data class Adjustments(
    val dropped: List<DroppedLine>,
    val clamped: List<ClampedLine>,
    val priceChanged: List<PriceChange>,
) {
    val isEmpty: Boolean get() = dropped.isEmpty() && clamped.isEmpty() && priceChanged.isEmpty()

    companion object {
        val NONE = Adjustments(emptyList(), emptyList(), emptyList())
    }
}

data class MergeResult(val lines: List<CartLine>, val adjustments: Adjustments)

/**
 * Pure merge of a guest cart into an existing user cart (ADR-0007).
 *
 * Policy:
 * - Duplicate products (guest+existing, or repeated guest lines): sum
 *   quantities, then clamp to available stock.
 * - Unknown/archived/out-of-stock products are dropped, with a reason.
 * - Existing user lines are re-validated too — the merged cart is always
 *   fully consistent with the catalog snapshot it was given.
 * - Price changes are reported for surviving guest lines whose display
 *   snapshot no longer matches; the snapshot is never used for math.
 * - Merging an empty guest cart with a valid existing cart is a no-op.
 *
 * No IO: the catalog snapshot arrives as a plain map, fetched by the use
 * case inside its transaction.
 */
fun mergeCarts(
    guestLines: List<GuestLine>,
    existingLines: List<CartLine>,
    products: Map<Uuid, ProductInfo>,
): MergeResult {
    // Preserve order: existing lines first, then new guest products.
    val requested = LinkedHashMap<Uuid, Int>()
    existingLines.forEach { requested.merge(it.productId, it.quantity, Int::plus) }
    guestLines.forEach { requested.merge(it.productId, it.quantity, Int::plus) }

    val guestSnapshots = guestLines
        .filter { it.priceSnapshotMinor != null }
        .associate { it.productId to it.priceSnapshotMinor!! }

    val merged = mutableListOf<CartLine>()
    val dropped = mutableListOf<DroppedLine>()
    val clamped = mutableListOf<ClampedLine>()
    val priceChanged = mutableListOf<PriceChange>()

    for ((productId, requestedQuantity) in requested) {
        val info = products[productId]
        when {
            info == null -> dropped += DroppedLine(productId, DropReason.NOT_FOUND)
            info.archived -> dropped += DroppedLine(productId, DropReason.ARCHIVED)
            info.stock == 0 -> dropped += DroppedLine(productId, DropReason.OUT_OF_STOCK)
            else -> {
                val granted = minOf(requestedQuantity, info.stock)
                if (granted < requestedQuantity) {
                    clamped += ClampedLine(productId, requestedQuantity, granted)
                }
                guestSnapshots[productId]?.let { snapshot ->
                    if (snapshot != info.priceMinor) {
                        priceChanged += PriceChange(productId, snapshot, info.priceMinor)
                    }
                }
                merged += CartLine(productId, granted)
            }
        }
    }

    return MergeResult(lines = merged, adjustments = Adjustments(dropped, clamped, priceChanged))
}
