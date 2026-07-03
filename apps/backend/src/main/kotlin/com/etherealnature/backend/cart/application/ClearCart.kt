package com.etherealnature.backend.cart.application

import kotlin.uuid.Uuid

/** Empties a user's cart. No transaction — composed by the caller. */
class ClearCart(private val carts: CartRepository) {
    operator fun invoke(userId: Uuid) {
        carts.replace(userId, emptyList(), mergeId = null)
    }
}
