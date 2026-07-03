package com.etherealnature.backend.ordering.infrastructure

import com.etherealnature.backend.cart.application.ClearCart
import com.etherealnature.backend.cart.application.GetCartLines
import com.etherealnature.backend.catalog.application.DecrementStock
import com.etherealnature.backend.catalog.application.GetProductsByIds
import com.etherealnature.backend.catalog.application.StockDecrement
import com.etherealnature.backend.catalog.domain.ProductId
import com.etherealnature.backend.ordering.application.CartGateway
import com.etherealnature.backend.ordering.application.ProductCatalogPort
import com.etherealnature.backend.ordering.application.TransactionRunner
import com.etherealnature.backend.ordering.domain.OrderIntent
import com.etherealnature.backend.ordering.domain.ProductInfo
import kotlin.uuid.Uuid
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

/** In-process adapters onto other contexts' application services (§4.4). */

class CartAdapter(
    private val getCartLines: GetCartLines,
    private val clearCart: ClearCart,
) : CartGateway {
    override fun linesFor(userId: Uuid): List<OrderIntent> =
        getCartLines(userId).map { OrderIntent(productId = it.productId, quantity = it.quantity) }

    override fun clear(userId: Uuid) = clearCart(userId)
}

class CatalogAdapter(
    private val getProductsByIds: GetProductsByIds,
    private val decrement: DecrementStock,
) : ProductCatalogPort {

    override fun productInfo(ids: Collection<Uuid>): Map<Uuid, ProductInfo> =
        getProductsByIds(ids.map { ProductId(it) }).entries.associate { (id, product) ->
            id.value to ProductInfo(
                name = product.name,
                priceMinor = product.price.amountMinor,
                currency = product.price.currency,
                stock = product.stock.quantity,
                archived = product.archived,
            )
        }

    override fun decrementStock(items: List<OrderIntent>): List<Uuid> =
        decrement(items.map { StockDecrement(ProductId(it.productId), it.quantity) }).map { it.value }
}

class ExposedTransactionRunner(private val database: Database) : TransactionRunner {
    override fun <T> run(block: () -> T): T = transaction(database) { block() }
}
