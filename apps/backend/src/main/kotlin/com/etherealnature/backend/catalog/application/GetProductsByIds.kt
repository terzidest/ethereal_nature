package com.etherealnature.backend.catalog.application

import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductId

/**
 * Application service other contexts consume through their own ports
 * (e.g. cart's pricing/stock adapter). Missing ids are simply absent from
 * the result — the caller decides what absence means.
 *
 * No transaction here: callers compose it inside their own use-case
 * transaction via their TransactionRunner.
 */
class GetProductsByIds(private val products: ProductRepository) {
    operator fun invoke(ids: Collection<ProductId>): Map<ProductId, Product> =
        if (ids.isEmpty()) emptyMap() else products.findByIds(ids).associateBy { it.id }
}
