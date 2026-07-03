package com.etherealnature.backend.ordering

import com.etherealnature.backend.ordering.domain.Order
import com.etherealnature.backend.ordering.domain.OrderId
import com.etherealnature.backend.ordering.domain.OrderLine
import com.etherealnature.backend.ordering.domain.OrderStatus
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.uuid.Uuid

class OrderInvariantsTest {

    private fun line(quantity: Int = 1, priceMinor: Long = 1000) =
        OrderLine(Uuid.random(), "p", quantity, priceMinor, "EUR")

    @Test
    fun `order lines reject non-positive quantities and negative prices`() {
        assertFailsWith<IllegalArgumentException> { line(quantity = 0) }
        assertFailsWith<IllegalArgumentException> { line(quantity = -1) }
        assertFailsWith<IllegalArgumentException> { line(priceMinor = -1) }
    }

    @Test
    fun `an order cannot exist without lines`() {
        assertFailsWith<IllegalArgumentException> {
            Order(OrderId(Uuid.random()), Uuid.random(), emptyList(), OrderStatus.PLACED, Instant.now())
        }
    }

    @Test
    fun `order total is the sum of line totals`() {
        val order = Order(
            id = OrderId(Uuid.random()),
            userId = Uuid.random(),
            lines = listOf(line(quantity = 3, priceMinor = 500), line(quantity = 1, priceMinor = 250)),
            status = OrderStatus.PLACED,
            placedAt = Instant.now(),
        )
        assertEquals(3 * 500L + 250L, order.totalMinor)
    }
}
