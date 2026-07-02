package com.etherealnature.backend.catalog.infrastructure

import com.etherealnature.backend.catalog.application.TransactionRunner
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class ExposedTransactionRunner(private val database: Database) : TransactionRunner {
    override fun <T> run(block: () -> T): T = transaction(database) { block() }
}
