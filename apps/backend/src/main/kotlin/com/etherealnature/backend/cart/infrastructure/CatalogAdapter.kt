package com.etherealnature.backend.cart.infrastructure

import com.etherealnature.backend.cart.application.ProductCatalogPort
import com.etherealnature.backend.cart.domain.ProductInfo
import com.etherealnature.backend.catalog.application.GetProductsByIds
import com.etherealnature.backend.catalog.domain.ProductId
import kotlin.uuid.Uuid

/**
 * In-process adapter onto catalog's application service (ARCHITECTURE §4.4).
 * If catalog ever becomes its own service, only this class changes.
 */
class CatalogAdapter(private val getProductsByIds: GetProductsByIds) : ProductCatalogPort {

    override fun productInfo(ids: Collection<Uuid>): Map<Uuid, ProductInfo> =
        getProductsByIds(ids.map { ProductId(it) })
            .entries
            .associate { (id, product) ->
                id.value to ProductInfo(
                    name = product.name,
                    priceMinor = product.price.amountMinor,
                    currency = product.price.currency,
                    stock = product.stock.quantity,
                    archived = product.archived,
                )
            }
}
