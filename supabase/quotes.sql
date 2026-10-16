-- Adds the bulk-order quotes table to an existing Rad.Clo database.
-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  organisation text,
  purpose text not null,
  garment text not null,
  quantity int not null,
  needed_by date not null,
  budget text not null,
  message text,
  status text not null default 'new',
  note text,
  created_at timestamptz not null default now()
);

-- Only the server (service key) reads and writes quotes.
alter table quotes enable row level security;
