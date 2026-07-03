create table carts (
    user_id       uuid primary key,
    last_merge_id uuid,
    updated_at    timestamptz not null default now()
);

create table cart_lines (
    user_id    uuid    not null,
    product_id uuid    not null,
    quantity   integer not null check (quantity > 0),
    position   integer not null,
    primary key (user_id, product_id)
);

create index idx_cart_lines_user on cart_lines (user_id, position);
