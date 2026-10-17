-- Customer accounts (Google sign-in) and order tracking IDs.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- One row per signed-in customer, with details saved from checkout.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_url text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Only the server (service key) reads and writes profiles.
alter table profiles enable row level security;

-- Orders: who placed them, and the public tracking ID.
alter table orders add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table orders add column if not exists track_code text;
create unique index if not exists orders_track_code_key on orders (track_code);
create index if not exists orders_user_id_idx on orders (user_id);
