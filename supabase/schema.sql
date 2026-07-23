-- Fade Kings Barber Shop (Lynnwood) — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','barber')),
  name text not null,
  email text,
  phone text,
  location text,
  bio text,
  initials text not null default '',
  rating numeric not null default 5.0,
  cuts_done integer not null default 0,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles are readable by any authenticated user"
  on profiles for select to authenticated using (true);
create policy "users can insert their own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);
create policy "users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);
create policy "public can read barber profiles"
  on profiles for select to anon using (role = 'barber');

-- ── barber_services ──────────────────────────────────────────────────────
create table if not exists barber_services (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  price numeric not null,
  created_at timestamptz not null default now()
);

alter table barber_services enable row level security;
create policy "services are readable by any authenticated user"
  on barber_services for select to authenticated using (true);
create policy "barbers manage their own services"
  on barber_services for all to authenticated
  using (auth.uid() = barber_id) with check (auth.uid() = barber_id);
create policy "public can read barber services"
  on barber_services for select to anon using (true);

-- ── availability ─────────────────────────────────────────────────────────
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  slot_index integer not null check (slot_index between 0 and 8),
  blocked boolean not null default false,
  unique (barber_id, weekday, slot_index)
);

alter table availability enable row level security;
create policy "availability is readable by any authenticated user"
  on availability for select to authenticated using (true);
create policy "barbers manage their own availability"
  on availability for all to authenticated
  using (auth.uid() = barber_id) with check (auth.uid() = barber_id);
create policy "public can read availability"
  on availability for select to anon using (true);

-- ── bookings ─────────────────────────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  barber_id uuid not null references profiles(id) on delete cascade,
  service_id uuid references barber_services(id) on delete set null,
  service_name text not null,
  price numeric not null,
  date date not null,
  time text not null,
  status text not null default 'pending' check (status in ('pending','approved','declined','completed')),
  rating integer check (rating between 1 and 5),
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;
create policy "customers can read their own bookings"
  on bookings for select to authenticated using (auth.uid() = customer_id or auth.uid() = barber_id);
create policy "customers can create bookings"
  on bookings for insert to authenticated with check (auth.uid() = customer_id);
create policy "customers and barbers can update relevant bookings"
  on bookings for update to authenticated
  using (auth.uid() = customer_id or auth.uid() = barber_id);

-- ── posts (My Work grid) ────────────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references profiles(id) on delete cascade,
  media_url text not null,
  type text not null check (type in ('image','video')),
  created_at timestamptz not null default now()
);

alter table posts enable row level security;
create policy "posts are readable by any authenticated user"
  on posts for select to authenticated using (true);
create policy "barbers manage their own posts"
  on posts for all to authenticated
  using (auth.uid() = barber_id) with check (auth.uid() = barber_id);

-- ── notifications ────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  icon text not null default 'bell',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "users read their own notifications"
  on notifications for select to authenticated using (auth.uid() = user_id);
create policy "any authenticated user can notify another user"
  on notifications for insert to authenticated with check (true);
create policy "users mark their own notifications read"
  on notifications for update to authenticated using (auth.uid() = user_id);

-- ── rewards ──────────────────────────────────────────────────────────────
create table if not exists rewards (
  user_id uuid primary key references profiles(id) on delete cascade,
  points integer not null default 0
);

alter table rewards enable row level security;
create policy "users read their own rewards"
  on rewards for select to authenticated using (auth.uid() = user_id);
create policy "users manage their own rewards"
  on rewards for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── storage: barber "My Work" photos/videos ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

create policy "public read access to post media"
  on storage.objects for select using (bucket_id = 'posts');
create policy "barbers upload their own post media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "barbers delete their own post media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
