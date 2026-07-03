package com.etherealnature.backend.identity.infrastructure

import at.favre.lib.crypto.bcrypt.BCrypt
import com.etherealnature.backend.identity.application.PasswordHasher
import com.etherealnature.backend.identity.domain.PasswordHash
import com.etherealnature.backend.identity.domain.RawPassword

class BcryptPasswordHasher(private val cost: Int = 12) : PasswordHasher {

    override fun hash(password: RawPassword): PasswordHash =
        PasswordHash(BCrypt.withDefaults().hashToString(cost, password.value.toCharArray()))

    override fun verify(password: RawPassword, hash: PasswordHash): Boolean =
        BCrypt.verifyer().verify(password.value.toCharArray(), hash.value.toCharArray()).verified
}
