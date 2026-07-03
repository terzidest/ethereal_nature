package com.etherealnature.backend.cart.application

import com.etherealnature.backend.cart.domain.CartLine
import kotlin.uuid.Uuid

/**
 * Raw intents for other contexts (ordering re-prices itself). No
 * transaction — callers compose inside their own use-case transaction.
 */
class GetCartLines(private val carts: CartRepository) {
    operator fun invoke(userId: Uuid): List<CartLine> = carts.findLines(userId)
}
