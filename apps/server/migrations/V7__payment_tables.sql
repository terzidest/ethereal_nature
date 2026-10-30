create table payment_intents (
    id               uuid primary key,
    order_id         uuid        not null, -- bare uuid, no cross-context FK
    user_id          uuid        not null,
    amount_minor     bigint      not null check (amount_minor >= 0),
    currency         varchar(3)  not null,
    status           varchar(32) not null,
    created_at       timestamptz not null,
    settled_event_id varchar(100)
);

create index idx_payment_intents_order on payment_intents (order_id, created_at desc);

-- At most one open intent per order (backs CreatePaymentIntent's idempotency).
create unique index uniq_open_intent_per_order on payment_intents (order_id) where status = 'CREATED';
