package com.etherealnature.backend.cart

import com.etherealnature.backend.cart.domain.CartLine
import com.etherealnature.backend.cart.domain.DropReason
import com.etherealnature.backend.cart.domain.GuestLine
import com.etherealnature.backend.cart.domain.ProductInfo
import com.etherealnature.backend.cart.domain.mergeCarts
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.uuid.Uuid

class MergeCartsTest {

    private val lavender = Uuid.parse("0d9f3f65-1a2b-4c3d-8e4f-000000000001")
    private val quartz = Uuid.parse("0d9f3f65-1a2b-4c3d-8e4f-000000000009")
    private val ghost = Uuid.parse("0d9f3f65-1a2b-4c3d-8e4f-00000000dead")

    private fun info(priceMinor: Long = 1450, stock: Int = 10, archived: Boolean = false) =
        ProductInfo(name = "p", category = "HERBS", priceMinor = priceMinor, currency = "EUR", stock = stock, archived = archived)

    @Test
    fun `sums duplicate products then clamps to stock`() {
        val result = mergeCarts(
            guestLines = listOf(GuestLine(lavender, 4, null), GuestLine(lavender, 3, null)),
            existingLines = listOf(CartLine(lavender, 5)),
            products = mapOf(lavender to info(stock = 10)),
        )
        assertEquals(listOf(CartLine(lavender, 10)), result.lines)
        val clamp = result.adjustments.clamped.single()
        assertEquals(12, clamp.requestedQuantity)
        assertEquals(10, clamp.grantedQuantity)
    }

    @Test
    fun `drops unknown, archived, and out-of-stock products with reasons`() {
        val result = mergeCarts(
            guestLines = listOf(
                GuestLine(ghost, 1, null),
                GuestLine(lavender, 1, null),
                GuestLine(quartz, 2, null),
            ),
            existingLines = emptyList(),
            products = mapOf(
                lavender to info(archived = true),
                quartz to info(stock = 0),
            ),
        )
        assertTrue(result.lines.isEmpty())
        val reasons = result.adjustments.dropped.associate { it.productId to it.reason }
        assertEquals(DropReason.NOT_FOUND, reasons[ghost])
        assertEquals(DropReason.ARCHIVED, reasons[lavender])
        assertEquals(DropReason.OUT_OF_STOCK, reasons[quartz])
    }

    @Test
    fun `reports price changes for guest snapshots but never uses them for math`() {
        val result = mergeCarts(
            guestLines = listOf(GuestLine(lavender, 2, priceSnapshotMinor = 999)),
            existingLines = emptyList(),
            products = mapOf(lavender to info(priceMinor = 1450)),
        )
        val change = result.adjustments.priceChanged.single()
        assertEquals(999, change.snapshotPriceMinor)
        assertEquals(1450, change.currentPriceMinor)
        assertEquals(listOf(CartLine(lavender, 2)), result.lines)
    }

    @Test
    fun `matching snapshot produces no price-change entry`() {
        val result = mergeCarts(
            guestLines = listOf(GuestLine(lavender, 1, priceSnapshotMinor = 1450)),
            existingLines = emptyList(),
            products = mapOf(lavender to info(priceMinor = 1450)),
        )
        assertTrue(result.adjustments.isEmpty)
    }

    @Test
    fun `empty guest cart is a no-op on a valid existing cart`() {
        val existing = listOf(CartLine(lavender, 3), CartLine(quartz, 1))
        val result = mergeCarts(
            guestLines = emptyList(),
            existingLines = existing,
            products = mapOf(lavender to info(), quartz to info()),
        )
        assertEquals(existing, result.lines)
        assertTrue(result.adjustments.isEmpty)
    }

    @Test
    fun `existing lines are re-validated against the current catalog`() {
        val result = mergeCarts(
            guestLines = emptyList(),
            existingLines = listOf(CartLine(lavender, 5), CartLine(quartz, 2)),
            products = mapOf(lavender to info(stock = 2), quartz to info(stock = 0)),
        )
        assertEquals(listOf(CartLine(lavender, 2)), result.lines)
        assertEquals(1, result.adjustments.clamped.size)
        assertEquals(DropReason.OUT_OF_STOCK, result.adjustments.dropped.single().reason)
    }

    @Test
    fun `preserves existing order and appends new guest products`() {
        val result = mergeCarts(
            guestLines = listOf(GuestLine(lavender, 1, null)),
            existingLines = listOf(CartLine(quartz, 1)),
            products = mapOf(lavender to info(), quartz to info()),
        )
        assertEquals(listOf(quartz, lavender), result.lines.map { it.productId })
    }
}
