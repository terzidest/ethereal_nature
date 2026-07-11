package com.etherealnature.backend.payments.domain

import java.security.MessageDigest
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/** HMAC-SHA256 over the raw webhook body, lowercase hex — pure JDK, no framework. */
object WebhookSignature {
    private const val ALGORITHM = "HmacSHA256"

    fun sign(secret: String, payload: String): String =
        hmac(secret, payload).joinToString("") { "%02x".format(it) }

    fun verify(secret: String, payload: String, signatureHex: String?): Boolean {
        val provided = signatureHex?.let(::decodeHex) ?: return false
        // Constant-time comparison — a plain == would leak matching-prefix length.
        return MessageDigest.isEqual(hmac(secret, payload), provided)
    }

    private fun hmac(secret: String, payload: String): ByteArray =
        Mac.getInstance(ALGORITHM).run {
            init(SecretKeySpec(secret.toByteArray(Charsets.UTF_8), ALGORITHM))
            doFinal(payload.toByteArray(Charsets.UTF_8))
        }

    private fun decodeHex(hex: String): ByteArray? {
        if (hex.isEmpty() || hex.length % 2 != 0) return null
        val bytes = ByteArray(hex.length / 2)
        for (i in bytes.indices) {
            val hi = Character.digit(hex[2 * i], 16)
            val lo = Character.digit(hex[2 * i + 1], 16)
            if (hi < 0 || lo < 0) return null
            bytes[i] = ((hi shl 4) or lo).toByte()
        }
        return bytes
    }
}
