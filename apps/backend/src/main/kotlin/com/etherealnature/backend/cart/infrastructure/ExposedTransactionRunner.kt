package com.etherealnature.backend.cart.infrastructure

import com.etherealnature.backend.cart.application.TransactionRunner
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class ExposedTransactionRunner(private val database: Database) : TransactionRunner {
    override fun <T> run(block: () -> T): T = transaction(database) { block() }
}
