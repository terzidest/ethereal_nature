create table users (
    id            uuid primary key,
    email         varchar(254) not null unique,
    password_hash varchar(100) not null,
    role          varchar(32)  not null,
    created_at    timestamptz  not null default now()
);
