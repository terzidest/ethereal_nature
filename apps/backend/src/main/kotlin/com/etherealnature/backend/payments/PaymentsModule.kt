package com.etherealnature.backend.payments

import com.etherealnature.backend.payments.application.CreatePaymentIntent
import com.etherealnature.backend.payments.application.GetPaymentIntent
import com.etherealnature.backend.payments.application.HandlePspEvent
import com.etherealnature.backend.payments.application.OrderGateway
import com.etherealnature.backend.payments.application.PaymentIntentRepository
import com.etherealnature.backend.payments.application.PaymentsSettings
import com.etherealnature.backend.payments.application.TransactionRunner
import com.etherealnature.backend.payments.infrastructure.ExposedPaymentIntentRepository
import com.etherealnature.backend.payments.infrastructure.ExposedTransactionRunner
import com.etherealnature.backend.payments.infrastructure.OrderingAdapter
import org.koin.dsl.module

/** Composition root for the payments context. */
fun paymentsModule(settings: PaymentsSettings) = module {
    single { settings }
    single<TransactionRunner> { ExposedTransactionRunner(get()) }
    single<PaymentIntentRepository> { ExposedPaymentIntentRepository() }
    single<OrderGateway> { OrderingAdapter(get(), get()) }
    single { CreatePaymentIntent(get(), get(), get()) }
    single { GetPaymentIntent(get(), get()) }
    single { HandlePspEvent(get(), get(), get(), get()) }
}
