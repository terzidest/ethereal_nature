package com.etherealnature.backend.catalog.infrastructure

import com.etherealnature.backend.catalog.application.ProductPage
import com.etherealnature.backend.catalog.application.ProductQuery
import com.etherealnature.backend.catalog.application.ProductRepository
import com.etherealnature.backend.catalog.application.ProductSort
import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductId
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.selectAll

class ExposedProductRepository : ProductRepository {

    override fun findPage(query: ProductQuery): ProductPage {
        val predicate = buildPredicate(query)
        val total = ProductsTable.selectAll().where(predicate).count()

        val items = ProductsTable.selectAll()
            .where(predicate)
            .orderBy(*orderFor(query.sort))
            .limit(query.pageSize)
            .offset(((query.page - 1).toLong()) * query.pageSize)
            .map { it.toProduct() }

        return ProductPage(items = items, page = query.page, pageSize = query.pageSize, totalItems = total)
    }

    override fun findById(id: ProductId): Product? =
        ProductsTable.selectAll()
            .where(ProductsTable.id eq id.value)
            .singleOrNull()
            ?.toProduct()

    private fun buildPredicate(query: ProductQuery): Op<Boolean> {
        var predicate: Op<Boolean> = ProductsTable.archived eq false
        query.category?.let { category ->
            predicate = predicate and (ProductsTable.category eq category.name)
        }
        query.search?.trim()?.takeIf { it.isNotEmpty() }?.let { raw ->
            val term = raw.replace("\\", "").replace("%", "").replace("_", "").lowercase()
            if (term.isNotEmpty()) {
                predicate = predicate and (ProductsTable.name.lowerCase() like "%$term%")
            }
        }
        return predicate
    }

    private fun orderFor(sort: ProductSort) = when (sort) {
        ProductSort.NEWEST -> arrayOf(ProductsTable.createdAt to SortOrder.DESC, ProductsTable.id to SortOrder.ASC)
        ProductSort.NAME -> arrayOf(ProductsTable.name to SortOrder.ASC, ProductsTable.id to SortOrder.ASC)
        ProductSort.PRICE_ASC -> arrayOf(ProductsTable.priceMinor to SortOrder.ASC, ProductsTable.id to SortOrder.ASC)
        ProductSort.PRICE_DESC -> arrayOf(ProductsTable.priceMinor to SortOrder.DESC, ProductsTable.id to SortOrder.ASC)
    }
}
