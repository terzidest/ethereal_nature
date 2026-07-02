package com.etherealnature.backend.catalog

import com.etherealnature.backend.catalog.application.ProductPage
import com.etherealnature.backend.catalog.application.ProductQuery
import com.etherealnature.backend.catalog.application.ProductSort
import com.etherealnature.backend.catalog.domain.Money
import com.etherealnature.backend.catalog.domain.StockLevel
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ProductDomainTest {

    @Test
    fun `money rejects negative amounts and bad currency codes`() {
        assertFailsWith<IllegalArgumentException> { Money(-1, "EUR") }
        assertFailsWith<IllegalArgumentException> { Money(100, "eur") }
        assertFailsWith<IllegalArgumentException> { Money(100, "EURO") }
        Money(0, "EUR") // zero is valid
    }

    @Test
    fun `stock cannot be negative`() {
        assertFailsWith<IllegalArgumentException> { StockLevel(-1) }
        assertEquals(0, StockLevel(0).quantity)
    }

    @Test
    fun `product query validates pagination bounds`() {
        assertFailsWith<IllegalArgumentException> { query(page = 0) }
        assertFailsWith<IllegalArgumentException> { query(pageSize = 0) }
        assertFailsWith<IllegalArgumentException> { query(pageSize = 101) }
    }

    @Test
    fun `total pages rounds up and handles empty results`() {
        assertEquals(0, page(totalItems = 0).totalPages)
        assertEquals(1, page(totalItems = 12).totalPages)
        assertEquals(2, page(totalItems = 13).totalPages)
    }

    private fun query(page: Int = 1, pageSize: Int = 12) =
        ProductQuery(page = page, pageSize = pageSize, category = null, search = null, sort = ProductSort.NEWEST)

    private fun page(totalItems: Long) =
        ProductPage(items = emptyList(), page = 1, pageSize = 12, totalItems = totalItems)
}
