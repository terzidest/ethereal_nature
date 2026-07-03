package com.etherealnature.backend.identity

import com.etherealnature.backend.identity.application.AuthenticateUser
import com.etherealnature.backend.identity.application.EnsureAdminUser
import com.etherealnature.backend.identity.application.GetUser
import com.etherealnature.backend.identity.application.ListUsers
import com.etherealnature.backend.identity.application.PasswordHasher
import com.etherealnature.backend.identity.application.RegisterUser
import com.etherealnature.backend.identity.application.TokenIssuer
import com.etherealnature.backend.identity.application.TransactionRunner
import com.etherealnature.backend.identity.application.UserRepository
import com.etherealnature.backend.identity.infrastructure.BcryptPasswordHasher
import com.etherealnature.backend.identity.infrastructure.ExposedTransactionRunner
import com.etherealnature.backend.identity.infrastructure.ExposedUserRepository
import com.etherealnature.backend.identity.infrastructure.JwtSettings
import com.etherealnature.backend.identity.infrastructure.JwtTokenIssuer
import org.koin.dsl.module

/** Composition root for the identity context. */
fun identityModule(jwtSettings: JwtSettings) = module {
    single { jwtSettings }
    single<TransactionRunner> { ExposedTransactionRunner(get()) }
    single<UserRepository> { ExposedUserRepository() }
    single<PasswordHasher> { BcryptPasswordHasher() }
    single<TokenIssuer> { JwtTokenIssuer(get()) }
    single { RegisterUser(get(), get(), get(), get()) }
    single { AuthenticateUser(get(), get(), get(), get()) }
    single { GetUser(get(), get()) }
    single { ListUsers(get(), get()) }
    single { EnsureAdminUser(get(), get(), get()) }
}
