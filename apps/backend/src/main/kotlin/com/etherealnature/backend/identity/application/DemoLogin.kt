package com.etherealnature.backend.identity.application

import com.etherealnature.backend.identity.domain.Email
import com.etherealnature.backend.identity.domain.User

/** Demo-mode settings: the seeded read-only viewer and the one-click login flag. */
data class DemoSettings(
    val viewerEmail: String,
    val viewerPassword: String,
    val loginEnabled: Boolean,
)

/**
 * One-click demo sign-in: issues a token for the seeded viewer account.
 * No password crosses the wire — the route only exists when demo mode is
 * enabled, and enabling it is what seeds the account at boot.
 */
class DemoLogin(
    private val users: UserRepository,
    private val tokens: TokenIssuer,
    private val tx: TransactionRunner,
    private val settings: DemoSettings,
) {
    operator fun invoke(): Pair<User, IssuedToken> {
        val user = tx.run { users.findByEmail(Email(settings.viewerEmail)) }
            ?: error("Demo viewer account missing — bootstrap must run before routes are served")
        return user to tokens.issue(user)
    }
}
