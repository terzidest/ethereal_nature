package com.etherealnature.backend.catalog.api

import com.etherealnature.backend.catalog.application.ProductInput
import com.etherealnature.backend.catalog.application.ProductPage
import com.etherealnature.backend.catalog.domain.Product
import com.etherealnature.backend.catalog.domain.ProductCategory
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class ProductCategoryDto {
    OILS, HERBS, CRYSTALS, TEAS;

    fun toDomain(): ProductCategory = ProductCategory.valueOf(name)

    companion object {
        fun from(category: ProductCategory): ProductCategoryDto = valueOf(category.name)
    }
}

@Serializable
enum class ProductSortDto {
    @SerialName("newest") NEWEST,
    @SerialName("name") NAME,
    @SerialName("price-asc") PRICE_ASC,
    @SerialName("price-desc") PRICE_DESC,
}

@Serializable
data class ProductResponse(
    val id: String,
    val slug: String,
    val name: String,
    val description: String,
    val priceMinor: Long,
    val currency: String,
    val stock: Int,
    val category: ProductCategoryDto,
    val imageUrl: String?,
    val archived: Boolean,
)

@Serializable
data class ProductInputRequest(
    val name: String,
    val description: String,
    val priceMinor: Long,
    val currency: String,
    val stock: Int,
    val category: ProductCategoryDto,
    val imageUrl: String? = null,
)

@Serializable
data class ArchiveProductRequest(val archived: Boolean)

@Serializable
data class ProductListResponse(
    val items: List<ProductResponse>,
    val page: Int,
    val pageSize: Int,
    val totalItems: Long,
    val totalPages: Long,
)

fun Product.toResponse(): ProductResponse = ProductResponse(
    id = id.toString(),
    slug = slug,
    name = name,
    description = description,
    priceMinor = price.amountMinor,
    currency = price.currency,
    stock = stock.quantity,
    category = ProductCategoryDto.from(category),
    imageUrl = imageUrl,
    archived = archived,
)

fun ProductInputRequest.toInput(): ProductInput = ProductInput(
    name = name,
    description = description,
    priceMinor = priceMinor,
    currency = currency,
    stock = stock,
    category = category.toDomain(),
    imageUrl = imageUrl?.takeIf { it.isNotBlank() },
)

fun ProductPage.toResponse(): ProductListResponse = ProductListResponse(
    items = items.map { it.toResponse() },
    page = page,
    pageSize = pageSize,
    totalItems = totalItems,
    totalPages = totalPages,
)
