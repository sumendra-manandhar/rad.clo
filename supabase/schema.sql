-- Rad.Clo schema for the Supabase storage driver (lib/server/store.ts).
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- It also creates the public Storage bucket `print-designs`, where uploaded
-- designs, garment photos, customer artwork and 3D previews are stored.
--
-- Then run `node scripts/migrate-to-supabase.mjs` to copy your local data
-- (data/db.json + data/uploads) into Supabase.
--
-- The server uses the service_role key, which bypasses row level security.
-- RLS is enabled with no public policies so the anon key can't read or
-- write anything directly.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Existing installs already have print_designs (id, name, category,
-- image_url, is_active, created_at) — the columns below are added to it.
create table if not exists print_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  image_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table print_designs add column if not exists slug text;
alter table print_designs add column if not exists price int not null default 0;
alter table print_designs add column if not exists description text;
alter table print_designs add column if not exists featured boolean not null default false;
update print_designs set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 4)
  where slug is null;
-- Categories are now referenced by slug (e.g. "streetwear", not "Streetwear").
update print_designs set category = lower(category) where category <> lower(category);
create unique index if not exists print_designs_slug_key on print_designs (slug);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number int generated always as identity (start with 1001),
  customer jsonb not null,
  items jsonb not null,
  total int not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

alter table categories enable row level security;
alter table print_designs enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;
-- The old storefront read print_designs with the anon key; it no longer does.
drop policy if exists "Public can read active designs" on print_designs;

insert into categories (name, slug, description, sort) values
  ('Typography', 'typography', 'Bold words and statements', 1),
  ('Streetwear', 'streetwear', 'Loud graphics for the streets', 2),
  ('Minimal', 'minimal', 'Clean lines, quiet confidence', 3),
  ('Nature', 'nature', 'Mountains, sun and flowers', 4),
  ('Doodle', 'doodle', 'Playful hand-drawn art', 5)
on conflict (slug) do nothing;

-- Storage bucket for images (public read; the server uploads with the service key).
insert into storage.buckets (id, name, public)
values ('print-designs', 'print-designs', true)
on conflict (id) do update set public = true;
