create table products (
    id          uuid primary key,
    slug        varchar(120) not null unique,
    name        varchar(200) not null,
    description text         not null,
    price_minor bigint       not null check (price_minor >= 0),
    currency    varchar(3)   not null,
    stock       integer      not null check (stock >= 0),
    category    varchar(32)  not null,
    image_url   varchar(500),
    archived    boolean      not null default false,
    created_at  timestamptz  not null default now()
);

create index idx_products_category on products (category) where not archived;
create index idx_products_created_at on products (created_at desc);
