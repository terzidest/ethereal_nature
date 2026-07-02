package com.etherealnature.backend.catalog.infrastructure

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.timestamp

object ProductsTable : Table("products") {
    val id = uuid("id")
    val slug = varchar("slug", 120)
    val name = varchar("name", 200)
    val description = text("description")
    val priceMinor = long("price_minor")
    val currency = varchar("currency", 3)
    val stock = integer("stock")
    val category = varchar("category", 32)
    val imageUrl = varchar("image_url", 500).nullable()
    val archived = bool("archived")
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
