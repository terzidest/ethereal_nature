package com.etherealnature.backend.catalog.infrastructure

import com.etherealnature.backend.catalog.domain.Money
import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductCategory
import com.etherealnature.backend.catalog.domain.ProductId
import com.etherealnature.backend.catalog.domain.StockLevel
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toProduct(): Product = Product(
    id = ProductId(this[ProductsTable.id]),
    slug = this[ProductsTable.slug],
    name = this[ProductsTable.name],
    description = this[ProductsTable.description],
    price = Money(this[ProductsTable.priceMinor], this[ProductsTable.currency]),
    stock = StockLevel(this[ProductsTable.stock]),
    category = ProductCategory.valueOf(this[ProductsTable.category]),
    imageUrl = this[ProductsTable.imageUrl],
    archived = this[ProductsTable.archived],
)
