package com.etherealnature.backend.identity.infrastructure

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.etherealnature.backend.identity.application.IssuedToken
import com.etherealnature.backend.identity.application.TokenIssuer
import com.etherealnature.backend.identity.domain.User
import java.time.Instant

data class JwtSettings(
    val secret: String,
    val issuer: String,
    val audience: String,
    val expiresInMinutes: Long,
)

class JwtTokenIssuer(private val settings: JwtSettings) : TokenIssuer {

    override fun issue(user: User): IssuedToken {
        val expiresAt = Instant.now().plusSeconds(settings.expiresInMinutes * 60)
        val token = JWT.create()
            .withIssuer(settings.issuer)
            .withAudience(settings.audience)
            .withSubject(user.id.toString())
            .withClaim("email", user.email.value)
            .withClaim("role", user.role.name)
            .withExpiresAt(expiresAt)
            .sign(Algorithm.HMAC256(settings.secret))
        return IssuedToken(token = token, expiresAtEpochSeconds = expiresAt.epochSecond)
    }
}
