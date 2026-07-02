package com.etherealnature.backend.catalog.application

/**
 * Port for the transaction boundary. Use cases own transactions
 * (one use case = one transaction) without importing Exposed.
 */
interface TransactionRunner {
    fun <T> run(block: () -> T): T
}
