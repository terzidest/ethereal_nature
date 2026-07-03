package com.etherealnature.backend.cart.application

import com.etherealnature.backend.cart.domain.CartLine
import com.etherealnature.backend.cart.domain.ProductInfo
import kotlin.uuid.Uuid

/**
 * Cart's window onto the catalog (price, stock, name — everything the cart
 * may know about a product). The adapter calls catalog's application
 * service; the cart never touches catalog tables. Subsumes the
 * ProductPricing/StockChecker pair from ARCHITECTURE §4.4 as one port.
 */
interface ProductCatalogPort {
    fun productInfo(ids: Collection<Uuid>): Map<Uuid, ProductInfo>
}

interface CartRepository {
    fun findLines(userId: Uuid): List<CartLine>
    fun lastMergeId(userId: Uuid): Uuid?
    /** Rewrites the cart atomically (within the use case's transaction). */
    fun replace(userId: Uuid, lines: List<CartLine>, mergeId: Uuid?)
}

interface TransactionRunner {
    fun <T> run(block: () -> T): T
}
