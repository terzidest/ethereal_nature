create table orders (
    id        uuid primary key,
    user_id   uuid        not null,
    status    varchar(32) not null,
    placed_at timestamptz not null
);

create index idx_orders_user on orders (user_id, placed_at desc);
create index idx_orders_status on orders (status, placed_at desc);

create table order_lines (
    order_id         uuid         not null,
    product_id       uuid         not null,
    name             varchar(200) not null,
    quantity         integer      not null check (quantity > 0),
    unit_price_minor bigint       not null check (unit_price_minor >= 0),
    currency         varchar(3)   not null,
    position         integer      not null,
    primary key (order_id, product_id)
);
