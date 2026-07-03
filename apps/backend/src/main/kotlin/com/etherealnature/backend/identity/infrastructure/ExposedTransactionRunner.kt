package com.etherealnature.backend.identity.infrastructure

import com.etherealnature.backend.identity.application.TransactionRunner
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class ExposedTransactionRunner(private val database: Database) : TransactionRunner {
    override fun <T> run(block: () -> T): T = transaction(database) { block() }
}
