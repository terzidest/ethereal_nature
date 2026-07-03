package com.etherealnature.backend.ordering

import com.etherealnature.backend.ordering.domain.IssueKind
import com.etherealnature.backend.ordering.domain.OrderIntent
import com.etherealnature.backend.ordering.domain.OrderStatus
import com.etherealnature.backend.ordering.domain.ProductInfo
import com.etherealnature.backend.ordering.domain.priceCart
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.uuid.Uuid

class OrderDomainTest {

    private val a = Uuid.parse("00000000-0000-0000-0000-00000000000a")
    private val b = Uuid.parse("00000000-0000-0000-0000-00000000000b")

    private fun info(priceMinor: Long = 1000, stock: Int = 10, archived: Boolean = false) =
        ProductInfo("p", priceMinor, "EUR", stock, archived)

    @Test
    fun `prices from catalog only and totals correctly`() {
        val priced = priceCart(
            listOf(OrderIntent(a, 2), OrderIntent(b, 1)),
            mapOf(a to info(priceMinor = 1450), b to info(priceMinor = 3250)),
        )
        assertTrue(priced.isPlaceable)
        assertEquals(2 * 1450L + 3250L, priced.totalMinor)
    }

    @Test
    fun `checkout never clamps - insufficient stock is a blocking issue`() {
        val priced = priceCart(listOf(OrderIntent(a, 5)), mapOf(a to info(stock = 3)))
        assertFalse(priced.isPlaceable)
        val issue = priced.issues.single()
        assertEquals(IssueKind.INSUFFICIENT_STOCK, issue.kind)
        assertEquals(5, issue.requestedQuantity)
        assertEquals(3, issue.availableStock)
    }

    @Test
    fun `missing and archived products are unavailable issues`() {
        val priced = priceCart(
            listOf(OrderIntent(a, 1), OrderIntent(b, 1)),
            mapOf(b to info(archived = true)),
        )
        assertEquals(2, priced.issues.size)
        assertTrue(priced.issues.all { it.kind == IssueKind.UNAVAILABLE })
    }

    @Test
    fun `status transitions are strictly linear`() {
        assertTrue(OrderStatus.PLACED.canTransitionTo(OrderStatus.PAID))
        assertTrue(OrderStatus.PAID.canTransitionTo(OrderStatus.PACKED))
        assertTrue(OrderStatus.PACKED.canTransitionTo(OrderStatus.SHIPPED))
        assertFalse(OrderStatus.PLACED.canTransitionTo(OrderStatus.SHIPPED))
        assertFalse(OrderStatus.PAID.canTransitionTo(OrderStatus.PLACED))
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.SHIPPED))
        assertEquals(null, OrderStatus.SHIPPED.next)
    }
}
